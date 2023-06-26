function doGet() {
  var template = HtmlService.createTemplateFromFile('test1.html');
  template.data = getDataFromSheet();
  return template.evaluate();
}


function getDataFromSheet() {
  var id = '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw';
  var sheet = SpreadsheetApp.openById(id).getSheetByName('借用列表');
  return sheet.getDataRange().getValues();
}


