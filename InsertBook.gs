var SHEET_ID = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
var SPREADSHEET = SpreadsheetApp.openById(SHEET_ID);
var insertsheet = SPREADSHEET.getSheetByName('testinsert');

// booking_date
// selected_className
// teacherName
// classSubject
// descript
// inputValue

function updateSheet(booking_date, selected_className, teacherName, classSubject, descript) {
    Logger.log([booking_date, selected_className, teacherName, classSubject, descript]);
    insertsheet.appendRow([booking_date, selected_className, teacherName, classSubject, descript]);
}
