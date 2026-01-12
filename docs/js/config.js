// API 配置文件
// 請在部署後將這個 URL 替換為您的 Google Apps Script Web App URL
const API_CONFIG = {
    // 開發環境 - 請替換為您的 GAS Web App URL
    API_URL: 'https://script.google.com/macros/s/AKfycbxjxBk04wibqHNR5gBmQu954QPc3fP-FhB-rGo9Bn-amByy3OjIrbakWAkee8vXQqY/exec',
    
    // Google Spreadsheet ID (用於開啟試算表連結)
    SHEET_ID: '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw',
    
    // API 請求超時時間 (毫秒)
    TIMEOUT: 30000,
    
    // 重試次數
    MAX_RETRIES: 3
};

// 環境檢查
if (API_CONFIG.API_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
    console.warn('⚠️ 請在 config.js 中設定正確的 API_URL！');
}
