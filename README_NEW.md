# 平板預約管理系統 - 前後端分離版本

## 專案架構

本專案已重構為前後端分離架構：

- **前端**：靜態 HTML/CSS/JavaScript（部署至 GitHub Pages）
- **後端**：Google Apps Script（提供 JSON API）

```
PadBookings/
├── docs/                    # GitHub Pages 前端檔案
│   ├── index.html          # 主頁面
│   ├── app.js              # 前端邏輯
│   ├── config.js           # API 配置
│   └── styles.css          # 樣式表
│
├── index_api.gs            # GAS API 主檔案（新版）
├── InsertBooking.gs        # 資料處理與 API 端點
├── CalendarIntegration.gs  # 日曆整合功能
├── Convert.gs              # 資料轉換工具
│
├── index.gs                # GAS 原始檔案（舊版，保留）
├── Bookings.html           # 原始 HTML 模板（舊版，保留）
└── README.md               # 本文件
```

## 部署步驟

### 一、部署 Google Apps Script 後端

1. **準備 GAS 專案**
   ```bash
   # 如果尚未設定 clasp
   npm install -g @google/clasp
   clasp login
   ```

2. **上傳檔案到 GAS**
   ```bash
   # 上傳新版 API 檔案（包含 CORS 支援）
   clasp push --force
   ```

3. **部署為 Web App**
   - 開啟 Google Apps Script 編輯器：https://script.google.com/
   - 點擊「部署」→「新增部署作業」
   - 類型選擇：「網頁應用程式」
   - 設定：
     - 說明：`API v1.0` 或任何版本描述
     - 執行身分：`我`
     - 具有應用程式存取權的使用者：`任何人`（**重要**：需要允許跨域請求）
   - 點擊「部署」
   - **複製 Web App URL**（格式：`https://script.google.com/macros/s/{SCRIPT_ID}/exec`）

4. **記下 Web App URL**
   - 此 URL 將用於前端配置

### 二、設定前端配置

1. **編輯 `docs/config.js`**
   ```javascript
   const API_CONFIG = {
       // 將此處替換為上一步複製的 GAS Web App URL
       BASE_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
       
       // Spreadsheet ID（確認是否正確）
       SHEET_ID: '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw'
   };
   ```

2. **驗證設定**
   - 確保 `SHEET_ID` 與您的 Google Spreadsheet ID 一致
   - 確保 `BASE_URL` 是完整的 GAS Web App URL

### 三、部署前端到 GitHub Pages

#### 方法 A：使用 GitHub 網頁介面

1. **建立 GitHub Repository**
   - 登入 GitHub
   - 建立新的 repository（例如：`pad-booking-system`）

2. **上傳 `docs` 資料夾內容**
   - 進入 repository
   - 點擊「Add file」→「Upload files」
   - 上傳 `docs` 資料夾中的所有檔案：
     - `index.html`
     - `app.js`
     - `config.js`
     - `styles.css`

3. **啟用 GitHub Pages**
   - 進入 repository 的「Settings」
   - 左側選單選擇「Pages」
   - Source 選擇：`Deploy from a branch`
   - Branch 選擇：`main` 分支，資料夾選擇 `/root`
   - 點擊「Save」

4. **存取網站**
   - GitHub Pages 將在幾分鐘內部署完成
   - 網址格式：`https://YOUR_USERNAME.github.io/pad-booking-system/`

#### 方法 B：使用 Git 命令列

1. **初始化 Git（如果尚未初始化）**
   ```bash
   cd c:\Users\user\Documents\PadBookings
   git init
   ```

2. **創建 .gitignore**
   ```bash
   # 建立 .gitignore 檔案
   echo "*.gs" > .gitignore
   echo "Bookings.html" >> .gitignore
   echo "appsscript.json" >> .gitignore
   ```

3. **提交前端檔案**
   ```bash
   git add docs/
   git add README.md
   git commit -m "Initial commit: Frontend files for GitHub Pages"
   ```

4. **推送到 GitHub**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/pad-booking-system.git
   git branch -M main
   git push -u origin main
   ```

5. **在 GitHub 啟用 Pages**（同方法 A 步驟 3）

### 四、測試系統

1. **開啟 GitHub Pages 網址**
   - 例如：`https://YOUR_USERNAME.github.io/pad-booking-system/`

2. **檢查功能**
   - ✅ 載入初始資料（email、設備列表、節次列表）
   - ✅ 選擇日期和節次後，檢查設備可用性
   - ✅ 提交借用申請
   - ✅ 查看借用紀錄
   - ✅ 查看設備狀況表
   - ✅ 查看預約詳情

3. **如果遇到錯誤**
   - 開啟瀏覽器開發者工具（F12）
   - 查看 Console 的錯誤訊息
   - 檢查 Network 標籤，確認 API 請求是否成功

## 常見問題

### Q1: CORS 錯誤
**問題**：前端無法連接到 GAS API，出現 CORS 錯誤

**解決方法**：
1. 確認 GAS 部署時選擇了「任何人」都可存取
2. 確認使用的是 Web App URL（不是 Script ID）
3. 嘗試重新部署 GAS，並建立新版本

### Q2: API 回傳 403 錯誤
**問題**：API 請求被拒絕

**解決方法**：
1. 檢查 GAS 部署設定中的「執行身分」是否為「我」
2. 確認 GAS 專案有正確的 Spreadsheet 存取權限

### Q3: 資料無法載入
**問題**：前端顯示「載入中...」但沒有資料

**解決方法**：
1. 檢查 `config.js` 中的 `BASE_URL` 是否正確
2. 開啟 Network 標籤，查看 API 請求的回應
3. 檢查 Spreadsheet ID 是否正確

### Q4: 更新前端後沒有變化
**問題**：修改前端檔案後，網頁沒有更新

**解決方法**：
1. 清除瀏覽器快取（Ctrl + F5）
2. 等待幾分鐘，GitHub Pages 需要時間部署
3. 確認檔案確實已推送到 GitHub

## 更新流程

### 更新前端
1. 修改 `docs` 資料夾中的檔案
2. 推送到 GitHub：
   ```bash
   git add docs/
   git commit -m "Update frontend"
   git push
   ```
3. GitHub Pages 會自動重新部署（約 1-5 分鐘）

### 更新後端
1. 修改 `.gs` 檔案
2. 上傳到 GAS：
   ```bash
   clasp push
   ```
3. 在 GAS 編輯器中：
   - 點擊「部署」→「管理部署作業」
   - 點擊現有部署的「編輯」圖示（鉛筆）
   - 建立「新版本」
   - 點擊「部署」
   - **URL 保持不變**，前端不需要修改配置

## 管理功能

### 刪除預約記錄
- 只有管理員（email: `555@tea.nknush.kh.edu.tw`）可以刪除預約
- 刪除操作會同時：
  1. 從 Spreadsheet 移除記錄
  2. 從 Google Calendar 刪除對應事件

### 查看日誌
在 GAS 編輯器中：
1. 點擊「執行作業」標籤
2. 查看最近的執行記錄
3. 點擊記錄可查看詳細的 Logger 輸出

## 架構優勢

✅ **分離關注點**：前端專注於使用者介面，後端專注於資料處理  
✅ **獨立部署**：前端和後端可以獨立更新  
✅ **靜態託管**：GitHub Pages 免費且快速  
✅ **易於維護**：程式碼組織清晰，易於除錯  
✅ **可擴展性**：未來可輕易切換前端框架或後端服務

## 技術棧

### 前端
- HTML5
- CSS3（Bootstrap 5.3）
- Vanilla JavaScript（無框架）
- Bootstrap Icons

### 後端
- Google Apps Script
- Google Sheets API
- Google Calendar API

## 授權

本專案僅供內部使用。

## 支援

如有問題，請聯繫系統管理員。
