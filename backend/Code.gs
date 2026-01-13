/**
 * Google Apps Script API 後端
 * 處理所有 HTTP 請求並返回 JSON 格式的數據
 * 
 * 版本：v2.2.0
 * 最後更新：2026-01-13
 * 更新內容：
 * - 全面優化所有 API 只讀取最近 500 筆記錄
 * - getBookingsByDateAPI, checkGearAvailabilityAPI, deleteFromSpreadsheet 都已優化
 * - 添加版本日誌以便追蹤部署狀態
 */

// 版本資訊
var VERSION = 'v2.2.0';
var LAST_UPDATE = '2026-01-13';

// 配置
var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var CALENDAR_ID = 'c_b13icnns9qbhs23he4tj8co8h8@group.calendar.google.com';

var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
var bookings = SPREADSHEET.getSheetByName('Bookings');
var gears = SPREADSHEET.getSheetByName('Gears');
var periods = SPREADSHEET.getSheetByName('Periods');

// 快取管理
var CACHE_DURATION = 300; // 快取 5 分鐘
var cache = CacheService.getScriptCache();

/**
 * 從快取獲取數據或執行函數
 */
function getCached(key, fetchFunction) {
    var cached = cache.get(key);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
            Logger.log('Cache parse error: ' + e.toString());
        }
    }
    
    var data = fetchFunction();
    try {
        cache.put(key, JSON.stringify(data), CACHE_DURATION);
    } catch (e) {
        Logger.log('Cache storage error: ' + e.toString());
    }
    return data;
}

/**
 * 清除特定快取
 */
function clearCache(key) {
    if (key) {
        cache.remove(key);
    } else {
        cache.removeAll(['gears', 'periods']);
    }
}

/**
 * 處理 GET 請求
 */
function doGet(e) {
    try {
        var action = e.parameter.action;
        Logger.log('=== API Request [' + VERSION + '] ===');
        Logger.log('Action: ' + action);
        
        switch(action) {
            case 'getGears':
                return jsonResponse(getGearsAPI());
                
            case 'getPeriods':
                return jsonResponse(getPeriodsAPI());
                
            case 'getBookingsByDate':
                return jsonResponse(getBookingsByDateAPI(e.parameter.date));
                
            case 'getRecentBookings':
                var limit = e.parameter.limit || 20;
                return jsonResponse(getRecentBookingsAPI(limit));
                
            case 'getGearStatusForDate':
                return jsonResponse(getGearStatusForDateAPI(e.parameter.date));
                
            case 'getUserInfo':
                return jsonResponse(getUserInfoAPI());
                
            case 'getSheetId':
                return jsonResponse({ sheetId: SHEET_ID });
                
            default:
                return jsonResponse({ error: 'Unknown action: ' + action }, 400);
        }
    } catch (error) {
        Logger.log('doGet Error: ' + error.toString());
        return jsonResponse({ error: error.toString() }, 500);
    }
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
    try {
        var data = JSON.parse(e.postData.contents);
        var action = data.action;
        
        switch(action) {
            case 'checkGearAvailability':
                return jsonResponse(checkGearAvailabilityAPI(data.date, data.periods));
                
            case 'submitBooking':
                return jsonResponse(submitBookingAPI(data));
                
            case 'deleteBooking':
                return jsonResponse(deleteBookingAPI(data.booking));
                
            default:
                return jsonResponse({ error: 'Unknown action: ' + action }, 400);
        }
    } catch (error) {
        Logger.log('doPost Error: ' + error.toString());
        return jsonResponse({ error: error.toString() }, 500);
    }
}



/**
 * 返回 JSON 格式的 HTTP 響應（含 CORS headers）
 */
function jsonResponse(data, statusCode) {
    statusCode = statusCode || 200;
    
    var output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    
    // Note: Google Apps Script Web Apps 部署時會自動處理 CORS
    // TextOutput 不支援 setHeader() 方法
    
    return output;
}

// ==================== API 函數 ====================

/**
 * 獲取設備列表（內部函數，無快取）
 */
function fetchGears() {
    var data = gears.getDataRange().getValues();
    var gearList = [];
    
    // 跳過標題行
    for (var i = 1; i < data.length; i++) {
        if (data[i][1]) { // 確保 title 存在
            gearList.push({
                id: data[i][0],
                title: data[i][1],
                descript: data[i][2] || '',
                visible: data[i][3] === true || String(data[i][3]).toUpperCase() === 'TRUE'
            });
        }
    }
    
    return gearList;
}

/**
 * 獲取設備列表（帶快取）
 */
function getGearsAPI() {
    try {
        var gearList = getCached('gears', fetchGears);
        return { gears: gearList };
    } catch (error) {
        Logger.log('getGearsAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 獲取節次列表（內部函數，無快取）
 */
function fetchPeriods() {
    var data = periods.getDataRange().getValues();
    var periodList = [];
    
    // 跳過標題行
    for (var i = 1; i < data.length; i++) {
        if (data[i][1]) { // 確保 id 存在
            periodList.push({
                id: data[i][1],
                name: data[i][2]
            });
        }
    }
    
    return periodList;
}

/**
 * 獲取節次列表（帶快取）
 */
function getPeriodsAPI() {
    try {
        var periodList = getCached('periods', fetchPeriods);
        return { periods: periodList };
    } catch (error) {
        Logger.log('getPeriodsAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 獲取特定日期的借用記錄（優化版本 - 限制讀取範圍）
 */
function getBookingsByDateAPI(dateString) {
    try {
        var targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        var targetTime = targetDate.getTime();
        
        var lastRow = bookings.getLastRow();
        if (lastRow <= 1) {
            return { bookings: [] };
        }
        
        var lastColumn = bookings.getLastColumn();
        
        // 優化：只讀取最近 500 筆記錄
        var maxRowsToRead = 500;
        var startRow = Math.max(2, lastRow - maxRowsToRead + 1);
        var numRows = lastRow - startRow + 1;
        
        var data = bookings.getRange(startRow, 1, numRows, lastColumn).getValues();
        
        var result = [];
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var rowDate = new Date(row[0]);
            rowDate.setHours(0, 0, 0, 0);
            
            if (rowDate.getTime() === targetTime) {
                result.push(formatBookingRecord(row));
            }
        }
        
        return { bookings: result };
    } catch (error) {
        Logger.log('getBookingsByDateAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 獲取最近的借用記錄
 */
function getRecentBookingsAPI(limit) {
    try {
        limit = parseInt(limit) || 20;
        
        var lastRow = bookings.getLastRow();
        if (lastRow <= 1) {
            return { bookings: [] };
        }
        
        var lastColumn = bookings.getLastColumn();
        var startRow = Math.max(2, lastRow - limit + 1);
        var numRows = lastRow - startRow + 1;
        
        var data = bookings.getRange(startRow, 1, numRows, lastColumn).getValues();
        
        var result = [];
        // 反轉陣列，最新的在前面
        for (var i = data.length - 1; i >= 0; i--) {
            result.push(formatBookingRecord(data[i]));
        }
        
        return { bookings: result };
    } catch (error) {
        Logger.log('getRecentBookingsAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 格式化借用記錄
 */
function formatBookingRecord(row) {
    return {
        date: formatDateString(row[0]),
        className: row[1] || '',
        teacher: row[2] || '',
        subject: row[3] || '',
        description: row[4] || '',
        period: row[5] || '',
        gear: row[6] || '',
        timestamp: row[7] ? formatTimestamp(row[7]) : ''
    };
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
function formatDateString(date) {
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
    }
    var d = new Date(date);
    return Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd');
}

/**
 * 格式化時間戳記
 */
function formatTimestamp(timestamp) {
    var d = new Date(timestamp);
    return Utilities.formatDate(d, 'GMT+8', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 檢查設備可用性（優化版本 - 限制讀取範圍）
 */
function checkGearAvailabilityAPI(dateString, selectedPeriods) {
    try {
        var targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        var targetTime = targetDate.getTime();
        
        // 使用快取的設備列表
        var allGears = getCached('gears', fetchGears);
        
        // 建立可見設備的 Map
        var gearMap = {};
        allGears.forEach(function(gear) {
            if (gear.visible) {
                gearMap[gear.title] = {
                    name: gear.title,
                    available: true
                };
            }
        });
        
        // 如果沒有可見設備，直接返回
        if (Object.keys(gearMap).length === 0) {
            return { gears: [] };
        }
        
        // 獲取該日期的借用記錄
        var lastRow = bookings.getLastRow();
        if (lastRow <= 1) {
            return { gears: Object.values(gearMap) };
        }
        
        var lastColumn = bookings.getLastColumn();
        
        // 優化：只讀取最近 500 筆記錄
        var maxRowsToRead = 500;
        var startRow = Math.max(2, lastRow - maxRowsToRead + 1);
        var numRows = lastRow - startRow + 1;
        
        var data = bookings.getRange(startRow, 1, numRows, lastColumn).getValues();
        
        // 建立選擇節次的 Set 以加快查找
        var periodSet = {};
        selectedPeriods.forEach(function(p) { periodSet[p] = true; });
        
        // 單次遍歷檢查衝突
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var rowDate = new Date(row[0]);
            rowDate.setHours(0, 0, 0, 0);
            
            if (rowDate.getTime() === targetTime) {
                var bookedGear = String(row[6]).trim();
                var bookedPeriod = String(row[5]).trim();
                
                // 使用 Set 快速檢查節次衝突
                if (periodSet[bookedPeriod] && gearMap[bookedGear]) {
                    gearMap[bookedGear].available = false;
                }
            }
        }
        
        return { gears: Object.values(gearMap) };
    } catch (error) {
        Logger.log('checkGearAvailabilityAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 提交借用申請
 */
function submitBookingAPI(data) {
    try {
        var timestamp = new Date();
        
        // 批量準備資料
        var rows = data.periods.map(function(period) {
            return [
                data.date,
                data.className,
                data.teacher,
                data.subject,
                data.description,
                period,
                data.gear,
                timestamp
            ];
        });
        
        // 批量寫入（比多次 appendRow 快）
        if (rows.length > 0) {
            var lastRow = bookings.getLastRow();
            bookings.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows);
        }
        
        // 創建日曆事件
        try {
            createCalendarEvents(data);
        } catch (calendarError) {
            Logger.log('Calendar creation failed: ' + calendarError.toString());
            // 日曆創建失敗不影響主要功能
        }
        
        return { success: true, message: '借用申請提交成功' };
    } catch (error) {
        Logger.log('submitBookingAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 創建日曆事件
 */
function createCalendarEvents(data) {
    if (!CALENDAR_ID) {
        Logger.log('CALENDAR_ID not defined, skipping calendar creation');
        return;
    }
    
    try {
        var cal = CalendarApp.getCalendarById(CALENDAR_ID);
        if (!cal) {
            Logger.log('Cannot access calendar');
            return;
        }
        
        data.periods.forEach(function(period) {
            var timeInfo = getPeriodTimeInfo(period);
            if (!timeInfo) {
                Logger.log('Unknown period: ' + period);
                return;
            }
            
            var startDateTime = new Date(data.date + ' ' + timeInfo.startTime + ' GMT+8');
            var endDateTime = new Date(data.date + ' ' + timeInfo.endTime + ' GMT+8');
            
            var title = period + ' ' + data.gear + ' [' + data.teacher + ' ' + data.className + ']';
            var description = createEventDescription(data, period);
            
            cal.createEvent(title, startDateTime, endDateTime, {
                description: description,
                location: '圖書館'
            });
            
            Utilities.sleep(200);
        });
        
    } catch (error) {
        Logger.log('createCalendarEvents Error: ' + error.toString());
        throw error;
    }
}

/**
 * 獲取節次時間資訊
 */
function getPeriodTimeInfo(period) {
    var timeMap = {
        "第1節": { startTime: "08:00", endTime: "08:50" },
        "第2節": { startTime: "09:00", endTime: "09:50" },
        "第3節": { startTime: "10:05", endTime: "10:55" },
        "第4節": { startTime: "11:05", endTime: "11:55" },
        "午休": { startTime: "12:00", endTime: "13:05" },
        "第5節": { startTime: "13:15", endTime: "14:05" },
        "第6節": { startTime: "14:15", endTime: "15:05" },
        "第7節": { startTime: "15:15", endTime: "16:05" },
        "第8節": { startTime: "16:15", endTime: "17:05" }
    };
    return timeMap[period] || null;
}

/**
 * 創建事件描述
 */
function createEventDescription(data, period) {
    return [
        '📚 設備借用詳細資訊',
        '==================',
        '',
        '🔧 借用設備：' + data.gear,
        '👩‍🏫 借用教師：' + data.teacher,
        '🏫 班級：' + data.className,
        '📖 科目課程：' + data.subject,
        '📅 借用日期：' + data.date,
        '⏰ 借用節次：' + period,
        '📝 其他說明：' + (data.description || '無'),
        '',
        '📋 系統資訊',
        '==================',
        '⏱️ 登記時間：' + Utilities.formatDate(new Date(), 'GMT+8', 'yyyy/MM/dd HH:mm'),
        '🏢 借用地點：圖書館',
        '',
        '==================',
        '此借用記錄由平板預約管理系統自動產生'
    ].join('\n');
}

/**
 * 刪除借用記錄
 */
function deleteBookingAPI(booking) {
    try {
        // 檢查權限
        var currentUser = Session.getActiveUser().getEmail();
        if (currentUser !== '555@tea.nknush.kh.edu.tw') {
            throw new Error('權限不足：只有管理員可以刪除預約記錄');
        }
        
        // 從試算表刪除
        deleteFromSpreadsheet(booking);
        
        // 從日曆刪除
        try {
            deleteFromCalendar(booking);
        } catch (calendarError) {
            Logger.log('Calendar deletion failed: ' + calendarError.toString());
        }
        
        return { success: true, message: '預約記錄刪除成功' };
    } catch (error) {
        Logger.log('deleteBookingAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 從試算表刪除記錄（優化版本 - 限制讀取範圍）
 */
function deleteFromSpreadsheet(booking) {
    var lastRow = bookings.getLastRow();
    if (lastRow <= 1) return;
    
    var lastColumn = bookings.getLastColumn();
    
    // 優化：只讀取最近 500 筆記錄（刪除操作通常針對最近的記錄）
    var maxRowsToRead = 500;
    var startRow = Math.max(2, lastRow - maxRowsToRead + 1);
    var numRows = lastRow - startRow + 1;
    
    var data = bookings.getRange(startRow, 1, numRows, lastColumn).getValues();
    
    var matchedRows = [];
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        
        if (formatDateString(row[0]) === booking.date &&
            row[1] === booking.className &&
            row[2] === booking.teacher &&
            row[3] === booking.subject &&
            row[5] === booking.period &&
            row[6] === booking.gear) {
            
            // 注意：行號需要加上 startRow 的偏移量
            matchedRows.push(startRow + i);
        }
    }
    
    // 從後往前刪除
    matchedRows.reverse();
    matchedRows.forEach(function(rowNum) {
        bookings.deleteRow(rowNum);
    });
}

/**
 * 從日曆刪除事件
 */
function deleteFromCalendar(booking) {
    if (!CALENDAR_ID) return;
    
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return;
    
    var bookingDate = new Date(booking.date);
    var startDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    var endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    
    var events = cal.getEvents(startDate, endDate);
    
    events.forEach(function(event) {
        var title = event.getTitle();
        if (title.includes(booking.period) &&
            title.includes(booking.gear) &&
            title.includes(booking.teacher) &&
            title.includes(booking.className)) {
            event.deleteEvent();
        }
    });
}

/**
 * 獲取特定日期的設備狀況（優化版本 - 限制讀取範圍）
 */
function getGearStatusForDateAPI(dateString) {
    try {
        Logger.log('[' + VERSION + '] getGearStatusForDateAPI called for date: ' + dateString);
        var targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        var targetTime = targetDate.getTime();
        
        // 使用快取的設備列表
        var allGears = getCached('gears', fetchGears);
        
        // 建立設備狀態 Map
        var gearStatusMap = {};
        allGears.forEach(function(gear) {
            gearStatusMap[gear.title] = {
                name: gear.title,
                visible: gear.visible,
                bookedPeriods: [],
                bookingDetails: []
            };
        });
        
        // 優化：只讀取最近 90 天的記錄（減少讀取量）
        var lastRow = bookings.getLastRow();
        if (lastRow > 1) {
            var lastColumn = bookings.getLastColumn();
            
            // 計算要讀取的起始行（最多 500 行或從第 2 行開始）
            var maxRowsToRead = 500;
            var startRow = Math.max(2, lastRow - maxRowsToRead + 1);
            var numRows = lastRow - startRow + 1;
            
            Logger.log('Reading rows ' + startRow + ' to ' + lastRow + ' (total: ' + numRows + ' rows, table has ' + lastRow + ' rows)');
            var data = bookings.getRange(startRow, 1, numRows, lastColumn).getValues();
            
            // 單次遍歷處理所有記錄
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                var rowDate = new Date(row[0]);
                rowDate.setHours(0, 0, 0, 0);
                
                if (rowDate.getTime() === targetTime) {
                    var gearName = String(row[6]).trim();
                    var gearStatus = gearStatusMap[gearName];
                    
                    if (gearStatus) {
                        var period = String(row[5]).trim();
                        gearStatus.bookedPeriods.push(period);
                        gearStatus.bookingDetails.push({
                            period: period,
                            className: row[1] || '',
                            teacher: row[2] || '',
                            subject: row[3] || '',
                            description: row[4] || ''
                        });
                    }
                }
            }
        }
        
        return { gearStatus: Object.values(gearStatusMap) };
    } catch (error) {
        Logger.log('getGearStatusForDateAPI Error: ' + error.toString());
        throw error;
    }
}

/**
 * 獲取用戶資訊
 */
function getUserInfoAPI() {
    try {
        var email = Session.getActiveUser().getEmail();
        var isAdmin = (email === '555@tea.nknush.kh.edu.tw');
        
        return {
            email: email,
            isAdmin: isAdmin,
            sheetId: SHEET_ID,
            version: VERSION,
            lastUpdate: LAST_UPDATE
        };
    } catch (error) {
        Logger.log('getUserInfoAPI Error: ' + error.toString());
        return {
            email: 'unknown@example.com',
            isAdmin: false,
            sheetId: SHEET_ID
        };
    }
}
