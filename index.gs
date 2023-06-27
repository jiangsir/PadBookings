var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
var bookings = SPREADSHEET.getSheetByName('借用列表');
var gears = SPREADSHEET.getSheetByName('Gears');


function doGet() {
  var template = HtmlService.createTemplateFromFile('test1.html');
  // template.data = getDataFromSheet();
  template.data = getTop20Rows();
  template.gears = getGears();
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

function getTop20Rows() {
  //var sheet = SPREADSHEET.getSheetByName('借用列表'); // 使用適當的工作表名稱替換 'Sheet1'
  var lastColumn = bookings.getLastColumn();

  // getRange() 函數用於取得一個範圍。這裡的參數是（起始行，起始列，行數，列數）。
  // 我們的起始行是 1，起始列也是 1，我們要取 20 行，列數則是試算表的最後一列。

  var range = bookings.getRange(1, 1, 20, lastColumn); // 從第一行第一列開始，取20行資料
  var data = range.getValues();

  return data; // 此時的data是一個二維陣列，內含前20筆資料
}
