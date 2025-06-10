// 新增函數：將 Sheet1 資料轉換到 Sheet2
function convertSheet1ToSheet2() {
    var sheet1 = SPREADSHEET.getSheetByName('借用列表'); // 假設舊資料在 Sheet1
    var sheet2 = SPREADSHEET.getSheetByName('Bookings'); // 新格式的工作表
    
    if (!sheet1) {
        Logger.log("錯誤：找不到 Sheet1 工作表");
        return "錯誤：找不到 Sheet1 工作表";
    }
    
    if (!sheet2) {
        Logger.log("錯誤：找不到 '借用列表' 工作表");
        return "錯誤：找不到 '借用列表' 工作表";
    }
    
    // 獲取 Sheet1 的所有資料
    var sheet1Data = sheet1.getDataRange().getValues();
    var convertedData = [];
    var successCount = 0;
    var errorCount = 0;
    
    Logger.log("開始轉換 Sheet1 資料，共 " + (sheet1Data.length - 1) + " 筆記錄");
    
    // 從第二行開始處理（跳過標題行）
    for (var i = 1; i < sheet1Data.length; i++) {
        var row = sheet1Data[i];
        
        try {
            // Sheet1 欄位對應：
            // 0: 時間戳記
            // 1: 借用日期
            // 2: 借用節次
            // 3: 年級/處室/學科
            // 4: 其他說明
            // 5: 班級/會議/研習
            // 6: 其他說明
            // 7: 任課教師/借用人
            // 8: 科目/課程
            // 9: 借用台數及機器編號
            // 10: 借用設備
            // 11: 確認欄位
            // 12: 使用人數
            
            var timestamp = row[0];
            var borrowDate = row[1];
            var periods = row[2]; // "第2節, 第4節"
            var gradeLevel = row[3]; // "高一"
            var otherDesc1 = row[4] || "";
            var classInfo = row[5]; // "義, 禮"
            var otherDesc2 = row[6] || "";
            var teacher = row[7];
            var subject = row[8];
            var equipmentCount = row[9] || "";
            var equipment = row[10]; // "Chrome一車38台+wifi"
            
            // 處理日期格式
            var formattedDate;
            if (borrowDate instanceof Date) {
                formattedDate = Utilities.formatDate(borrowDate, "GMT+8", "yyyy-MM-dd");
            } else {
                // 如果是字串，嘗試解析
                var dateObj = new Date(borrowDate);
                formattedDate = Utilities.formatDate(dateObj, "GMT+8", "yyyy-MM-dd");
            }
            
            // 1. 分割節次
            var periodArray = [];
            if (periods && typeof periods === 'string') {
                periodArray = periods.split(',').map(function(p) {
                    return p.trim();
                }).filter(function(p) {
                    return p !== "";
                });
            }
            
            // 2. 分割班級
            var classArray = [];
            if (classInfo && typeof classInfo === 'string') {
                var classes = classInfo.split(',').map(function(c) {
                    return c.trim();
                }).filter(function(c) {
                    return c !== "";
                });
                
                // 組合年級和班級
                classes.forEach(function(className) {
                    if (className === '跨班' || className === '跨年級') {
                        classArray.push(className);
                    } else {
                        classArray.push(gradeLevel + className);
                    }
                });
            }
            
            // 如果沒有班級資訊，使用年級
            if (classArray.length === 0) {
                classArray.push(gradeLevel || "未知");
            }
            
            // 3. 處理設備名稱
            var processedEquipment = processEquipmentName(equipment);
            
            // 組合其他說明
            var combinedDescription = [otherDesc1, otherDesc2, equipmentCount].filter(function(desc) {
                return desc && desc.trim() !== "";
            }).join(", ");
            
            // 生成所有組合的記錄
            classArray.forEach(function(className) {
                periodArray.forEach(function(period) {
                    var newRow = [
                        formattedDate,        // 借用日期
                        className,           // 班級
                        teacher,            // 借用教師
                        subject,            // 課程名稱
                        combinedDescription, // 其它說明
                        period,             // 節次
                        processedEquipment, // 設備
                        timestamp           // timestamp
                    ];
                    convertedData.push(newRow);
                });
            });
            
            successCount++;
            
        } catch (error) {
            Logger.log("處理第 " + (i + 1) + " 行時發生錯誤: " + error.toString());
            errorCount++;
        }
    }
    
    // 將轉換後的資料寫入 Sheet2
    if (convertedData.length > 0) {
        // 獲取 Sheet2 的最後一行
        var lastRow = sheet2.getLastRow();
        
        // 寫入新資料
        var range = sheet2.getRange(lastRow + 1, 1, convertedData.length, convertedData[0].length);
        range.setValues(convertedData);
        
        Logger.log("轉換完成！");
        Logger.log("成功處理: " + successCount + " 筆原始記錄");
        Logger.log("產生: " + convertedData.length + " 筆新記錄");
        Logger.log("錯誤: " + errorCount + " 筆");
        
        return "轉換完成！成功處理 " + successCount + " 筆原始記錄，產生 " + convertedData.length + " 筆新記錄，錯誤 " + errorCount + " 筆";
    } else {
        return "沒有資料需要轉換";
    }
}

// 輔助函數：處理設備名稱
function processEquipmentName(originalEquipment) {
    if (!originalEquipment || typeof originalEquipment !== 'string') {
        return "未知設備";
    }
    
    var equipment = originalEquipment.trim();
    
    // 設備名稱對應規則
    var equipmentMappings = [
        // Chrome 系列
        { pattern: /Chrome一車/i, replacement: "ChromeBook一車" },
        { pattern: /Chrome二車/i, replacement: "ChromeBook二車" },
        { pattern: /Chrome三車/i, replacement: "ChromeBook三車" },
        { pattern: /Chrome四車/i, replacement: "ChromeBook四車" },
        { pattern: /Chrome五車/i, replacement: "ChromeBook五車" },
        { pattern: /Chrome六車/i, replacement: "ChromeBook六車" },
        { pattern: /Chrome七車/i, replacement: "ChromeBook七車" },
        { pattern: /Chrome八車/i, replacement: "ChromeBook八車" },
        { pattern: /Chrome九車/i, replacement: "ChromeBook九車" },
        
        // iPad 系列
        { pattern: /iPad\s*黑\s*一車/i, replacement: "iPad黑一車" },
        { pattern: /iPad\s*黑/i, replacement: "iPad黑一車" },
        { pattern: /iPad\s*白\s*一車/i, replacement: "iPad白一車" },
        { pattern: /iPad\s*白/i, replacement: "iPad白一車" },
        
        // Chromebook 的其他變體
        { pattern: /Chromebook/i, replacement: "ChromeBook一車" }
    ];
    
    // 應用對應規則
    for (var j = 0; j < equipmentMappings.length; j++) {
        var mapping = equipmentMappings[j];
        if (mapping.pattern.test(equipment)) {
            return mapping.replacement;
        }
    }
    
    // 如果沒有匹配的規則，返回處理過的名稱
    // 移除數量、wifi 等額外資訊
    var cleanedEquipment = equipment
        .replace(/\d+台/g, "")           // 移除 "38台"
        .replace(/\+wifi/gi, "")        // 移除 "+wifi"
        .replace(/\+Wifi/gi, "")        // 移除 "+Wifi"
        .replace(/wifi/gi, "")          // 移除 "wifi"
        .replace(/\s+/g, " ")           // 合併多個空格
        .trim();
    
    return cleanedEquipment || "其他設備";
}

// 測試轉換函數（可選）
function testConvertSheet1ToSheet2() {
    var result = convertSheet1ToSheet2();
    Logger.log("轉換結果: " + result);
    return result;
}
