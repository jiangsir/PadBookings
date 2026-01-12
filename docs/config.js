// Google Apps Script API 設定
// 請在部署後替換為您的 GAS Web App URL
const API_CONFIG = {
    // 將此 URL 替換為您的 Google Apps Script Web App URL
    // 格式: https://script.google.com/macros/s/{SCRIPT_ID}/exec
    BASE_URL: 'YOUR_GAS_WEB_APP_URL_HERE',
    
    // Google Spreadsheet ID (用於開啟試算表連結)
    SHEET_ID: '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw'
};

// API 端點
const API_ENDPOINTS = {
    getInitData: `${API_CONFIG.BASE_URL}?action=getInitData`,
    getBookingsByDate: `${API_CONFIG.BASE_URL}?action=getBookingsByDate`,
    getAvailableGears: `${API_CONFIG.BASE_URL}?action=getAvailableGears`,
    updateSheet: `${API_CONFIG.BASE_URL}?action=updateSheet`,
    getGearStatus: `${API_CONFIG.BASE_URL}?action=getGearStatus`,
    deleteBooking: `${API_CONFIG.BASE_URL}?action=deleteBooking`
};
