var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var CALENDAR_ID = 'c_b13icnns9qbhs23he4tj8co8h8@group.calendar.google.com'; // 添加這行

var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
var Bookings_sheet = SPREADSHEET.getSheetByName('Bookings');
//var bookings = SPREADSHEET.getSheetByName('借用列表');
var bookings = SPREADSHEET.getSheetByName('Bookings');
var gears = SPREADSHEET.getSheetByName('Gears');
var periods = SPREADSHEET.getSheetByName('Periods');

function updateSheet(booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue) {
    try {
        Logger.log("updateSheet: " + [booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue]);

        // Use forEach() to iterate over each selected period
        selectedPeriods.forEach(function (period) {
            // Append a new row for each selected period, adding a timestamp at the end
            Bookings_sheet.appendRow([booking_date, selected_className, teacherName, classSubject, descript, period, selectedGearRadioValue, new Date()]);
        });

        // 新增：在成功新增資料後，同步創建日曆事件
        try {
            createCalendarEventsNew(booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue);
            Logger.log("日曆事件創建成功");
        } catch (calendarError) {
            // 日曆創建失敗不影響主要的資料新增功能
            Logger.log("日曆事件創建失敗（不影響資料新增）: " + calendarError.toString());
            // 可以選擇是否向用戶顯示警告，或者靜默處理
        }

        return "資料新增成功";

    } catch (error) {
        Logger.log("updateSheet 發生錯誤: " + error.toString());
        throw new Error("資料新增失敗: " + error.message);
    }
}

// 除錯函數：檢查實際的欄位結構
function debugSheetStructure() {
    var lastColumn = bookings.getLastColumn();
    var range = bookings.getRange(1, 1, 5, lastColumn); // 只取前5行來檢查
    var data = range.getValues();
    
    Logger.log("=== 工作表結構除錯 ===");
    Logger.log("總欄位數: " + lastColumn);
    
    // 印出標題行
    Logger.log("標題行 (index 0): " + data[0].join(' | '));
    
    // 印出前幾行資料，並標示欄位索引
    for (var i = 1; i < data.length && i < 5; i++) {
        var rowInfo = "資料行 " + i + ": ";
        for (var j = 0; j < data[i].length; j++) {
            rowInfo += "[" + j + "]=" + data[i][j] + " | ";
        }
        Logger.log(rowInfo);
    }
    
    return "檢查完成，請查看 Logger";
}

// 修正函數：檢查特定日期和節次的設備可用性
function getAvailableGearsForDateAndPeriods(date_string, selectedPeriodsFromUI) {
    var targetDate = new Date(date_string);
    Logger.log("getAvailableGearsForDateAndPeriods for date: " + targetDate.toDateString() + ", UI selected periods: " + selectedPeriodsFromUI.join(', '));
    
    // 獲取所有設備
    var allGearsData = getGears(); // getGears() 來自 index.gs, 返回 Gears 工作表的所有資料
    var availableGears = [];
    
    // Gears 工作表欄位: A=id (索引0), B=title (索引1), C=descript (索引2), D=visible (索引3)
    // 從第二行開始（跳過標題行）
    for (var i = 1; i < allGearsData.length; i++) {
        // 確保該行存在且 title (allGearsData[i][1]) 不為空
        if (allGearsData[i] && allGearsData[i][1] != null && String(allGearsData[i][1]).trim() !== "") {
            var gearTitle = String(allGearsData[i][1]).trim();
            var isVisible = allGearsData[i][3]; // visible 欄位 (D欄, 索引3)
            
            // 只處理 visible 為 TRUE 的設備 (布林值 true 或字串 "TRUE")
            if (isVisible === true || String(isVisible).toUpperCase() === 'TRUE') {
                availableGears.push({
                    name: gearTitle, // 使用 title 作為設備名稱
                    available: true
                });
            }
        }
    }
    Logger.log("Initial list of VISIBLE gears: " + JSON.stringify(availableGears.map(g => g.name)));
    
    // 獲取該日期的所有借用記錄
    var lastColumnBookings = bookings.getLastColumn();
    var lastRowBookings = bookings.getLastRow();

    if (lastRowBookings === 0) { 
        Logger.log("Bookings sheet ('借用列表') is empty. All gears considered available.");
        return JSON.stringify(availableGears);
    }
    // 獲取包含標題的所有數據
    var bookingsData = bookings.getRange(1, 1, lastRowBookings, lastColumnBookings).getValues();
    
    // 印出標題行以確認欄位
    var bookingsHeaders = bookingsData[0];
    Logger.log("Headers from '借用列表': " + bookingsHeaders.join(' | '));
    
    // 轉換目標日期為無時間部分的日期對象
    targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    // 找到日期、節次、設備欄位的正確索引
    var dateColumnIndex = -1;
    var periodColumnIndex = -1;
    var gearColumnIndex = -1;
    
    for (var i = 0; i < bookingsHeaders.length; i++) {
        var header = bookingsHeaders[i].toString().toLowerCase().trim();
        if (header.includes('日期') || header.includes('date')) {
            dateColumnIndex = i;
        } else if (header.includes('節次') || header.includes('period')) {
            periodColumnIndex = i;
        } else if (header.includes('設備') || header.includes('gear') || header.includes('equipment')) {
            gearColumnIndex = i;
        }
    }
    
    Logger.log("Identified column indices in '借用列表' - Date: " + dateColumnIndex + ", Period: " + periodColumnIndex + ", Gear: " + gearColumnIndex);
    
    if (dateColumnIndex === -1 || periodColumnIndex === -1 || gearColumnIndex === -1) {
        Logger.log("ERROR: Critical columns (Date, Period, or Gear) not found in '借用列表' headers. Please verify sheet structure. All gears will be shown as available.");
        return JSON.stringify(availableGears);
    }
    
    // 過濾出目標日期的借用記錄 (跳過標題行)
    var dayBookings = bookingsData.slice(1).filter(function (row) {
        if (!row[dateColumnIndex]) return false; // 跳過日期為空的行
        var rowDate = new Date(row[dateColumnIndex]);
        rowDate = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
        return rowDate.getTime() === targetDate.getTime();
    });
    
    Logger.log("Target date for filtering: " + targetDate.toDateString());
    Logger.log(dayBookings.length + " booking(s) found for this date.");

    // 遍歷目標日期的每一筆借用記錄
    dayBookings.forEach(function(bookingRow) {
        var bookedGearName = bookingRow[gearColumnIndex] ? bookingRow[gearColumnIndex].toString().trim() : null;
        var sheetPeriodsString = bookingRow[periodColumnIndex] ? bookingRow[periodColumnIndex].toString() : "";
        
        if (!bookedGearName) {
            Logger.log("Skipping a booking row due to missing gear name.");
            return; // 如果這筆預訂沒有設備名稱，則跳過
        }

        // 將試算表中的節次字串（例如 "第5節, 第6節"）分割成陣列（例如 ["第5節", "第6節"]）
        // 並去除每個節次字串前後的空白
        var bookedPeriodsInSheet = sheetPeriodsString.split(',').map(function(p) { return p.trim(); }).filter(Boolean); // filter(Boolean) 移除空字串

        Logger.log("Processing booking for gear: '" + bookedGearName + "', booked in sheet for periods: [" + bookedPeriodsInSheet.join(', ') + "]");

        // 檢查使用者在UI上選擇的任一節次，是否與這筆預訂記錄中的任一節次重疊
        var isConflict = selectedPeriodsFromUI.some(function(uiPeriod) {
            uiPeriod = uiPeriod.trim(); // 確保UI節次也去除空白
            return bookedPeriodsInSheet.includes(uiPeriod);
        });

        if (isConflict) {
            // 如果有重疊，則將該設備標記為不可用
            var gearToUpdate = availableGears.find(function(g) { return g.name === bookedGearName; });
            if (gearToUpdate) {
                if (gearToUpdate.available) { // 只有在它還是可用的時候才更新並記錄日誌
                    Logger.log("CONFLICT FOUND: Gear '" + bookedGearName + "' is booked during at least one of the selected UI periods [" + selectedPeriodsFromUI.join(', ') + "]. Marking as unavailable.");
                    gearToUpdate.available = false;
                }
            } else {
                Logger.log("Warning: Booked gear '" + bookedGearName + "' from sheet not found in the master gear list.");
            }
        }
    });
    
    Logger.log("Final availability status for UI: " + JSON.stringify(availableGears));
    return JSON.stringify(availableGears);
}

function getBookingsByDate(date_string) {
    var targetDate = new Date(date_string);
    Logger.log("getBookingsByDate: " + targetDate);
    
    var lastColumn = bookings.getLastColumn();
    var lastRow = bookings.getLastRow();
    Logger.log("lastColumn: " + lastColumn + ", lastRow: " + lastRow);
    
    var range = bookings.getRange(1, 1, lastRow, lastColumn);
    var data = range.getValues();
    
    // 列印標題行以確認欄位順序
    Logger.log("Headers: " + data[0].join(', '));
    Logger.log("Headers with index: ");
    for (var h = 0; h < data[0].length; h++) {
        Logger.log("[" + h + "] " + data[0][h]);
    }
  
    targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    Logger.log("Formatted target date: " + targetDate);
    
    // 找到日期欄位的正確索引
    var dateColumnIndex = -1;
    for (var i = 0; i < data[0].length; i++) {
        var header = data[0][i].toString().toLowerCase();
        if (header.includes('日期') || header.includes('date')) {
            dateColumnIndex = i;
            break;
        }
    }
    
    if (dateColumnIndex === -1) {
        Logger.log("ERROR: 找不到日期欄位");
        return JSON.stringify([]);
    }
    
    Logger.log("Using date column index: " + dateColumnIndex);
  
    var filteredData = data.filter(function (row, index) {
      if (index === 0) return false; // 跳過標題行
      
      var rowDate = new Date(row[dateColumnIndex]);
      rowDate = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      
      Logger.log("Row " + index + " date: " + rowDate + " vs target: " + targetDate);
      return rowDate.getTime() === targetDate.getTime();
    });
    
    Logger.log("Filtered data count: " + filteredData.length);
    filteredData.forEach(function (row, index) {
      Logger.log('Filtered Row ' + (index + 1) + ': ' + row.join(', '));
    });

    return JSON.stringify(filteredData);
}

// 修正：取得特定日期的設備狀況
function getGearStatusForDate(date_string) {
    try {
        var targetDate = new Date(date_string);
        Logger.log("getGearStatusForDate for date: " + targetDate.toDateString());
        
        // 獲取所有設備
        var allGearsData = getGears();
        var gearStatusList = [];
        var periods = ['第1節', '第2節', '第3節', '第4節', '午休', '第5節', '第6節', '第7節'];
        
        // 獲取該日期的所有借用記錄
        var bookingsJson = getBookingsByDate(date_string);
        var dayBookings = JSON.parse(bookingsJson);
        
        Logger.log("Day bookings count: " + dayBookings.length);
        
        // 從第二行開始處理設備（跳過標題行）
        for (var i = 1; i < allGearsData.length; i++) {
            if (allGearsData[i] && allGearsData[i][1] != null && String(allGearsData[i][1]).trim() !== "") {
                var gearTitle = String(allGearsData[i][1]).trim();
                var isVisible = allGearsData[i][3];
                
                Logger.log("Processing gear: " + gearTitle + ", visible: " + isVisible);
                
                var gearStatus = {
                    name: gearTitle,
                    visible: (isVisible === true || String(isVisible).toUpperCase() === 'TRUE'),
                    bookedPeriods: [],
                    bookingDetails: []
                };
                
                // 檢查每個節次是否被借用
                periods.forEach(function(period) {
                    var bookingDetail = dayBookings.find(function(booking) {
                        // booking 結構：0=借用日期, 1=班級, 2=借用教師, 3=課程名稱, 4=其它說明, 5=節次, 6=設備, 7=timestamp
                        var bookedGear = booking[6] ? String(booking[6]).trim() : '';
                        var bookedPeriod = booking[5] ? String(booking[5]).trim() : '';
                        
                        return bookedGear === gearTitle && bookedPeriod === period;
                    });
                    
                    if (bookingDetail) {
                        gearStatus.bookedPeriods.push(period);
                        gearStatus.bookingDetails.push({
                            period: period,
                            className: bookingDetail[1] || '未知班級',
                            teacher: bookingDetail[2] || '未知教師',
                            subject: bookingDetail[3] || '未知課程',
                            description: bookingDetail[4] || '' // 確保其他說明欄位正確對應到索引4
                        });
                        
                        // Debug log 確認 description 有被正確讀取
                        Logger.log("Booking detail for " + gearTitle + " at " + period + ": description = '" + (bookingDetail[4] || '') + "'");
                    }
                });
                
                gearStatusList.push(gearStatus);
            }
        }
        
        Logger.log("Generated gear status list with " + gearStatusList.length + " items");
        return JSON.stringify(gearStatusList);
        
    } catch (error) {
        Logger.log("Error in getGearStatusForDate: " + error.toString());
        return JSON.stringify([]);
    }
}

// 新增：刪除預約記錄的函數
function deleteBookingRecord(booking) {
    try {
        // 檢查權限
        var currentUser = Session.getActiveUser().getEmail();
        if (currentUser !== '555@tea.nknush.kh.edu.tw') {
            throw new Error('權限不足：只有管理員可以刪除預約記錄');
        }
        
        Logger.log("開始刪除預約記錄: " + JSON.stringify(booking));
        
        // 1. 從試算表中刪除記錄
        var deleteResult = deleteFromSpreadsheet(booking);
        Logger.log("試算表刪除結果: " + deleteResult);
        
        // 2. 從日曆中刪除相關事件
        try {
            var calendarResult = deleteFromCalendar(booking);
            Logger.log("日曆刪除結果: " + calendarResult);
        } catch (calendarError) {
            Logger.log("日曆刪除失敗（不影響試算表刪除）: " + calendarError.toString());
            // 日曆刪除失敗不影響整體操作
        }
        
        return "預約記錄刪除成功";
        
    } catch (error) {
        Logger.log("deleteBookingRecord 發生錯誤: " + error.toString());
        throw new Error("刪除預約記錄失敗: " + error.message);
    }
}

// 新增：從試算表中刪除記錄
function deleteFromSpreadsheet(booking) {
    try {
        var lastRow = Bookings_sheet.getLastRow();
        var lastColumn = Bookings_sheet.getLastColumn();
        
        if (lastRow <= 1) {
            return "試算表中沒有資料可刪除";
        }
        
        // 獲取所有資料
        var range = Bookings_sheet.getRange(2, 1, lastRow - 1, lastColumn);
        var data = range.getValues();
        
        // 尋找匹配的記錄
        var matchedRows = [];
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            
            // 比較關鍵欄位來確定是否為同一筆記錄
            var rowDate = formatDateForComparison(row[0]); // 借用日期
            var bookingDate = formatDateForComparison(booking[0]);
            
            if (rowDate === bookingDate &&
                row[1] === booking[1] && // 班級
                row[2] === booking[2] && // 教師
                row[3] === booking[3] && // 課程
                row[5] === booking[5] && // 節次
                row[6] === booking[6]) { // 設備
                
                matchedRows.push(i + 2); // +2 因為陣列從0開始，且跳過標題行
                Logger.log("找到匹配記錄於第 " + (i + 2) + " 行");
            }
        }
        
        if (matchedRows.length === 0) {
            throw new Error("找不到匹配的預約記錄");
        }
        
        // 從後往前刪除，避免行號變動問題
        matchedRows.reverse();
        var deletedCount = 0;
        
        for (var j = 0; j < matchedRows.length; j++) {
            Bookings_sheet.deleteRow(matchedRows[j]);
            deletedCount++;
            Logger.log("已刪除第 " + matchedRows[j] + " 行");
        }
        
        return "成功從試算表刪除 " + deletedCount + " 筆記錄";
        
    } catch (error) {
        Logger.log("deleteFromSpreadsheet 發生錯誤: " + error.toString());
        throw new Error("從試算表刪除記錄失敗: " + error.message);
    }
}

// 修正：從日曆中刪除事件
function deleteFromCalendar(booking) {
    try {
        // 檢查 CALENDAR_ID 是否定義
        if (!CALENDAR_ID) {
            Logger.log("CALENDAR_ID 未定義，跳過日曆事件刪除");
            return "CALENDAR_ID 未定義，跳過日曆事件刪除";
        }
        
        var cal = CalendarApp.getCalendarById(CALENDAR_ID);
        if (!cal) {
            Logger.log("無法存取日曆，跳過日曆事件刪除");
            return "無法存取日曆，跳過日曆事件刪除";
        }
        
        // 解析日期
        var bookingDate = new Date(booking[0]);
        var startDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
        var endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 加一天
        
        // 獲取該日期的所有事件
        var events = cal.getEvents(startDate, endDate);
        Logger.log("找到 " + events.length + " 個日曆事件");
        
        var deletedCount = 0;
        var period = booking[5]; // 節次
        var equipment = booking[6]; // 設備
        var teacher = booking[2]; // 教師
        var className = booking[1]; // 班級
        
        // 尋找匹配的事件
        events.forEach(function(event) {
            var title = event.getTitle();
            
            // 檢查事件標題是否包含關鍵資訊
            if (title.includes(period) && 
                title.includes(equipment) && 
                title.includes(teacher) && 
                title.includes(className)) {
                
                Logger.log("找到匹配的日曆事件: " + title);
                event.deleteEvent();
                deletedCount++;
                Logger.log("已刪除日曆事件: " + title);
            }
        });
        
        if (deletedCount === 0) {
            Logger.log("警告：沒有找到匹配的日曆事件");
            return "沒有找到匹配的日曆事件";
        }
        
        Utilities.sleep(500); // 等待日曆更新
        return "成功從日曆刪除 " + deletedCount + " 個事件";
        
    } catch (error) {
        Logger.log("deleteFromCalendar 發生錯誤: " + error.toString());
        // 不要拋出錯誤，只記錄並返回訊息
        return "從日曆刪除事件失敗: " + error.message;
    }
}

// 新增：格式化日期以便比較
function formatDateForComparison(dateValue) {
    try {
        var date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            return "";
        }
        return date.getFullYear() + "-" + 
               ("0" + (date.getMonth() + 1)).slice(-2) + "-" + 
               ("0" + date.getDate()).slice(-2);
    } catch (error) {
        Logger.log("日期格式化錯誤: " + error.toString());
        return "";
    }
}

// 新增：測試刪除功能
function testDeleteBooking() {
    try {
        // 測試資料（請根據實際情況修改）
        var testBooking = [
            "2024-06-13",  // 借用日期
            "高一仁",      // 班級
            "測試老師",    // 教師
            "測試課程",    // 課程
            "測試說明",    // 說明
            "第1節",       // 節次
            "iPad黑一車",  // 設備
            new Date()     // 時間戳記
        ];
        
        var result = deleteBookingRecord(testBooking);
        Logger.log("測試結果: " + result);
        return result;
        
    } catch (error) {
        Logger.log("測試失敗: " + error.toString());
        return "測試失敗: " + error.message;
    }
}
