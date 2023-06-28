var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
var insertsheet = SPREADSHEET.getSheetByName('testinsert');
var bookings = SPREADSHEET.getSheetByName('借用列表');
var gears = SPREADSHEET.getSheetByName('Gears');
var periods = SPREADSHEET.getSheetByName('Periods');

// booking_date
// selected_className
// teacherName
// classSubject
// descript
// inputValue

function updateSheet(booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue) {
    Logger.log("updateSheet: " + [booking_date, selected_className, teacherName, classSubject, descript, selectedPeriods, selectedGearRadioValue]);

    // Use forEach() to iterate over each selected period
    selectedPeriods.forEach(function (period) {
        // Append a new row for each selected period
        insertsheet.appendRow([booking_date, selected_className, teacherName, classSubject, descript, period, selectedGearRadioValue]);
    });
}


function getAvailableGears(date_string) {
    // 根據日期來查找並回傳可用的設備
    // ...
    var date = new Date(date_string); // Convert the string back to a Date object.
    Logger.log("run getAvailableGears: " + date);
    var gears = getGears();
    Logger.log("getGears: " + gears);
    getBookingsByDate(date_string).forEach(function (booking) {
        // booking[11] is the gear name
        Logger.log("getAvailableGears: " + booking[11]);
        var index = gears.indexOf(booking[11]);
        if (index > -1) {
            gears.splice(index, 1);
        }
    });

    //return availableGears;
    return gears;
}

function getBookingsByDate(date_string) {
    var targetDate = new Date(date_string); // Convert the string back to a Date object.
    Logger.log("getBookingsByDate: " + targetDate);
    var lastColumn = bookings.getLastColumn();
    var lastRow = bookings.getLastRow();
    Logger.log("lastColumn: " + lastColumn);
    // 從試算表中獲取所有的資料行
    var range = bookings.getRange(1, 1, lastRow, lastColumn);
    var data = range.getValues();
  
    // 由於 Apps Script 日期對象包含時間部分，所以我們需要將目標日期轉換為無時間部分的日期對象
    targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
    // 過濾出第二個欄位（JavaScript 索引從 0 開始，所以 index 為 1）的值等於目標日期的資料行
    var filteredData = data.filter(function (row) {
      var rowDate = new Date(row[1]); // 轉換為日期對象
      rowDate = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()); // 移除時間部分
      return rowDate.getTime() === targetDate.getTime(); // 比較日期是否相等
    });
    Logger.log("filteredData: " + filteredData);
    filteredData.forEach(function (row, index) {
      Logger.log('Row ' + (index + 1) + ': ' + row.join(', '));
    });

    
    //return filteredData;
    return JSON.stringify(filteredData);
  }
  