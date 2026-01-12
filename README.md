# 平板預約管理系統 - 部署指南

## 專案概述

這是一個前後端分離的平板預約管理系統：
- **前端**: 靜態 HTML/CSS/JavaScript，部署在 GitHub Pages
- **後端**: Google Apps Script (GAS) Web API，負責讀取 Google Spreadsheet

## 目錄結構

```
PadBookings/
├── frontend/                 # 前端靜態文件 (部署到 GitHub Pages)
│   ├── index.html           # 主頁面
│   ├── css/
│   │   └── style.css        # 樣式文件
│   └── js/
│       ├── config.js        # API 配置文件
│       ├── api-client.js    # API 客戶端
│       └── app.js           # 主應用邏輯
│
├── backend/                 # 後端 Google Apps Script (部署到 GAS)
│   ├── Code.gs             # API 處理程式碼
│   └── appsscript.json     # GAS 配置文件
│
└── README.md               # 本文件
```

## 部署步驟

### 1. 部署後端 (Google Apps Script)

#### 步驟 1.1: 創建 GAS 專案

1. 訪問 [Google Apps Script](https://script.google.com/)
2. 點擊「新專案」
3. 將 `backend/Code.gs` 的內容複製到編輯器
4. 點擊「檔案」>「專案屬性」，在「appsscript.json」標籤中貼上 `backend/appsscript.json` 的內容

#### 步驟 1.2: 配置參數

在 `Code.gs` 中修改以下配置：

```javascript
var SHEET_ID = 'YOUR_SPREADSHEET_ID';  // 替換為您的試算表 ID
var CALENDAR_ID = 'YOUR_CALENDAR_ID';  // 替換為您的日曆 ID (可選)
```

#### 步驟 1.3: 部署為 Web App

1. 點擊「部署」>「新增部署作業」
2. 選擇類型：「網頁應用程式」
3. 配置：
   - **說明**: 平板預約管理系統 API
   - **執行身分**: 我 (your-email@gmail.com)
   - **具有存取權的使用者**: 任何人
4. 點擊「部署」
5. **重要**: 複製顯示的 Web App URL (格式類似: `https://script.google.com/macros/s/XXXXX/exec`)

### 2. 部署前端 (GitHub Pages)

#### 步驟 2.1: 創建 GitHub Repository

1. 在 GitHub 上創建新的 repository
2. 將 `frontend/` 資料夾的內容推送到 repository

```bash
cd frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

#### 步驟 2.2: 配置 API URL

在 `frontend/js/config.js` 中，將 `API_URL` 替換為步驟 1.3 中複製的 Web App URL：

```javascript
const API_CONFIG = {
    API_URL: 'https://script.google.com/macros/s/XXXXX/exec',  // 替換這裡
    SHEET_ID: '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw',
    TIMEOUT: 30000,
    MAX_RETRIES: 3
};
```

#### 步驟 2.3: 啟用 GitHub Pages

1. 在 GitHub repository 中，進入「Settings」
2. 在左側菜單選擇「Pages」
3. Source 選擇: `main` 分支，資料夾選擇 `/ (root)`
4. 點擊「Save」
5. 等待幾分鐘，你的網站將會發布在: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## 測試部署

### 測試後端 API

在瀏覽器中訪問以下 URL 測試 API：

```
https://script.google.com/macros/s/XXXXX/exec?action=getUserInfo
```

應該返回類似以下的 JSON：

```json
{
  "email": "your-email@gmail.com",
  "isAdmin": false,
  "sheetId": "12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw"
}
```

### 測試前端

訪問 GitHub Pages URL:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

應該能看到完整的預約系統界面。

## API 端點說明

### GET 端點

| 端點 | 參數 | 說明 |
|------|------|------|
| `?action=getGears` | - | 獲取所有設備列表 |
| `?action=getPeriods` | - | 獲取所有節次列表 |
| `?action=getBookingsByDate` | `date=YYYY-MM-DD` | 獲取特定日期的借用記錄 |
| `?action=getRecentBookings` | `limit=20` | 獲取最近的借用記錄 |
| `?action=getGearStatusForDate` | `date=YYYY-MM-DD` | 獲取特定日期的設備狀況 |
| `?action=getUserInfo` | - | 獲取當前用戶資訊 |
| `?action=getSheetId` | - | 獲取試算表 ID |

### POST 端點

| 動作 | 數據 | 說明 |
|------|------|------|
| `checkGearAvailability` | `{date, periods[]}` | 檢查設備可用性 |
| `submitBooking` | `{date, className, teacher, subject, description, periods[], gear}` | 提交借用申請 |
| `deleteBooking` | `{booking}` | 刪除借用記錄 (僅管理員) |

## 更新後端程式碼

當需要更新後端程式碼時：

1. 在 Google Apps Script 編輯器中修改程式碼
2. 點擊「部署」>「管理部署作業」
3. 點擊現有部署旁的編輯圖標
4. 選擇「新版本」
5. 點擊「部署」

**注意**: Web App URL 保持不變，前端無需修改。

## 更新前端程式碼

當需要更新前端程式碼時：

```bash
cd frontend
git add .
git commit -m "Update frontend"
git push
```

GitHub Pages 會自動重新部署。

## 疑難排解

### 前端無法連接到後端

1. 檢查 `config.js` 中的 `API_URL` 是否正確
2. 打開瀏覽器開發者工具 (F12) 查看 Console 錯誤
3. 確認 GAS 部署的「具有存取權的使用者」設定為「任何人」

### CORS 錯誤

Google Apps Script 自動處理 CORS，如果遇到 CORS 錯誤：
1. 確認 GAS 部署配置正確
2. 嘗試重新部署 GAS

### 日曆事件未創建

1. 檢查 `CALENDAR_ID` 是否正確
2. 確認 GAS 有權限訪問該日曆
3. 查看 GAS 執行記錄 (「執行」>「我的執行」)

## 功能特點

✅ 完全前後端分離
✅ 靜態前端，可部署在任何 CDN
✅ RESTful API 設計
✅ 支援即時設備可用性檢查
✅ 自動同步到 Google Calendar
✅ 響應式設計，支援手機/平板/電腦
✅ 管理員刪除功能

## 技術堆疊

- **前端**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **後端**: Google Apps Script
- **數據存儲**: Google Spreadsheet
- **日曆集成**: Google Calendar API

## 授權

本專案為內部使用，請勿外傳。

## 聯絡資訊

如有問題，請聯絡系統管理員。
