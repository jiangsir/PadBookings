var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
//var bookings = SPREADSHEET.getSheetByName('借用列表');
var bookings = SPREADSHEET.getSheetByName('Bookings');
var gears = SPREADSHEET.getSheetByName('Gears');
var periods = SPREADSHEET.getSheetByName('Periods');


function doGet() {
  var template = HtmlService.createTemplateFromFile('Bookings.html');
  // template.data = getDataFromSheet();
  template.bookings = getTop20Bookings();
  template.gears = getGears();
  template.periods = getPeriods();
  template.email = Session.getActiveUser().getEmail();
  // 新增今日日期和今日借用紀錄
  template.todayDate = getTodayDateString();
  template.todayBookings = getTodayBookings();
  // 傳遞 SHEET_ID 到 HTML
  template.SHEET_ID = SHEET_ID;

  return template.evaluate();
}


function getDataFromSheet() {
  //var sheet = SPREADSHEET.getSheetByName('借用列表');
  return bookings.getDataRange().getValues();
}


function getGears() {
  var data = gears.getDataRange().getValues();
  Logger.log(data);  // Log the returned data
  return data;
}

function getPeriods() {
  var data = periods.getDataRange().getValues();
  Logger.log(data);  // Log the returned data
  return data;
}

function getTop20Bookings() {
  //var sheet = SPREADSHEET.getSheetByName('借用列表'); // 使用適當的工作表名稱替換 'Sheet1'
  var lastColumn = bookings.getLastColumn();

  // getRange() 函數用於取得一個範圍。這裡的參數是（起始行，起始列，行數，列數）。
  // 我們的起始行是 1，起始列也是 1，我們要取 20 行，列數則是試算表的最後一列。

  var range = bookings.getRange(1, 1, 20, lastColumn); // 從第一行第一列開始，取20行資料
  var data = range.getValues();

  return data; // 此時的data是一個二維陣列，內含前20筆資料
}

// 新增函數：取得今日日期字串
function getTodayDateString() {
  var today = new Date();
  var year = today.getFullYear();
  var month = ('0' + (today.getMonth() + 1)).slice(-2);
  var day = ('0' + today.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

// 新增函數：取得今日借用紀錄
function getTodayBookings() {
  var todayString = getTodayDateString();
  var bookingsJson = getBookingsByDate(todayString);
  return JSON.parse(bookingsJson);
}

