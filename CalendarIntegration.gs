var CALENDAR_ID = 'c_b13icnns9qbhs23he4tj8co8h8@group.calendar.google.com'; // 請替換為您的日曆 ID

/**
 * 新版本：創建日曆事件
 * 在借用申請提交成功後調用
 */
function createCalendarEventsNew(booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue) {
    try {
        Logger.log("開始創建日曆事件");
        Logger.log("參數: " + JSON.stringify({
            booking_date: booking_date,
            selected_className: selected_className,
            teacherName: teacherName,
            classSubject: classSubject,
            descript: descript,
            selectedPeriods: selectedPeriods,
            selectedGearRadioValue: selectedGearRadioValue
        }));

        var cal = CalendarApp.getCalendarById(CALENDAR_ID);
        if (!cal) {
            Logger.log("錯誤：無法找到指定的日曆");
            throw new Error("無法存取日曆，請檢查日曆 ID 和權限");
        }

        // 為每個選擇的節次創建日曆事件
        selectedPeriods.forEach(function(period) {
            var timeInfo = getPeriodTimeInfo(period);
            
            if (!timeInfo) {
                Logger.log("警告：無法識別節次 " + period + "，跳過此節次");
                return;
            }

            // 建立開始和結束時間
            var startDateTime = new Date(booking_date + " " + timeInfo.startTime + " GMT+8");
            var endDateTime = new Date(booking_date + " " + timeInfo.endTime + " GMT+8");
            
            // 建立事件標題
            var title = period + " " + selectedGearRadioValue + " [" + teacherName + " " + selected_className + "]";
            
            // 建立事件描述
            var description = createEventDescription({
                hardware: selectedGearRadioValue,
                className: selected_className,
                teacherName: teacherName,
                subject: classSubject,
                description: descript,
                submitTime: Utilities.formatDate(new Date(), "GMT+8", "yyyy/MM/dd HH:mm"),
                bookingDate: booking_date,
                period: period
            });

            // 創建日曆事件
            var event = cal.createEvent(title, startDateTime, endDateTime, {
                description: description,
                location: "圖書館" // 可選：設定地點
            });

            Logger.log("成功創建日曆事件: " + title + " (" + startDateTime + " - " + endDateTime + ")");
            
            // 添加小延遲避免 API 限制
            Utilities.sleep(200);
        });

        Logger.log("所有日曆事件創建完成");
        return "日曆事件創建成功";

    } catch (error) {
        Logger.log("創建日曆事件時發生錯誤: " + error.toString());
        throw new Error("創建日曆事件失敗: " + error.message);
    }
}

/**
 * 根據節次名稱獲取時間資訊
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
 * 創建事件描述內容
 */
function createEventDescription(data) {
    var description = `
📚 設備借用詳細資訊
==================

🔧 借用設備：${data.hardware}
👩‍🏫 借用教師：${data.teacherName}
🏫 班級：${data.className}
📖 科目課程：${data.subject}
📅 借用日期：${data.bookingDate}
⏰ 借用節次：${data.period}
📝 其他說明：${data.description || '無'}

📋 系統資訊
==================
⏱️ 登記時間：${data.submitTime}
🏢 借用地點：圖書館
📞 聯絡資訊：圖書館櫃台

==================
此借用記錄由平板預約管理系統自動產生
    `.trim();

    return description;
}

/**
 * 測試函數：驗證日曆整合功能
 */
function testCalendarIntegration() {
    try {
        // 測試資料
        var testData = {
            booking_date: "2024-06-13",
            selected_className: "高一仁",
            teacherName: "測試老師",
            classSubject: "測試課程",
            descript: "測試說明",
            selectedPeriods: ["第1節", "第2節"],
            selectedGearRadioValue: "iPad黑一車"
        };

        var result = createCalendarEventsNew(
            testData.booking_date,
            testData.selected_className,
            testData.teacherName,
            testData.classSubject,
            testData.descript,
            testData.selectedPeriods,
            testData.selectedGearRadioValue
        );

        Logger.log("測試結果: " + result);
        return result;

    } catch (error) {
        Logger.log("測試失敗: " + error.toString());
        return "測試失敗: " + error.message;
    }
}

/**
 * 檢查日曆權限和可用性
 */
function checkCalendarAccess() {
    try {
        var cal = CalendarApp.getCalendarById(CALENDAR_ID);
        if (cal) {
            Logger.log("日曆存取成功");
            Logger.log("日曆名稱: " + cal.getName());
            Logger.log("日曆描述: " + cal.getDescription());
            return {
                success: true,
                calendarName: cal.getName(),
                message: "日曆存取正常"
            };
        } else {
            Logger.log("無法存取日曆");
            return {
                success: false,
                message: "無法存取指定的日曆，請檢查日曆 ID 和權限"
            };
        }
    } catch (error) {
        Logger.log("檢查日曆存取時發生錯誤: " + error.toString());
        return {
            success: false,
            message: "日曆存取錯誤: " + error.message
        };
    }
}

/**
 * 刪除測試事件（清理用）
 */
function deleteTestEvents() {
    try {
        var cal = CalendarApp.getCalendarById(CALENDAR_ID);
        var today = new Date();
        var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        
        var events = cal.getEvents(today, tomorrow);
        var deletedCount = 0;
        
        events.forEach(function(event) {
            if (event.getTitle().includes("測試")) {
                event.deleteEvent();
                deletedCount++;
                Logger.log("已刪除測試事件: " + event.getTitle());
            }
        });
        
        Logger.log("共刪除 " + deletedCount + " 個測試事件");
        return "已刪除 " + deletedCount + " 個測試事件";
        
    } catch (error) {
        Logger.log("刪除測試事件時發生錯誤: " + error.toString());
        return "刪除失敗: " + error.message;
    }
}