# 部署檢查清單

## 前置準備

- [ ] 已安裝 Node.js 和 npm
- [ ] 已安裝 clasp：`npm install -g @google/clasp`
- [ ] 已建立 GitHub 帳號
- [ ] 已啟用 Google Apps Script API（https://script.google.com/home/usersettings）

## Google Apps Script 部署

### 1. 準備 GAS 專案

- [ ] 執行 `clasp login` 登入 Google 帳號
- [ ] 確認 `.clasp.json` 檔案存在且包含正確的 scriptId
- [ ] 確認 `appsscript.json` 設定正確

### 2. 上傳檔案到 GAS

- [ ] 執行 `clasp push --force`
- [ ] 確認上傳的檔案：
  - [ ] index_api.gs（新版 API 主檔案）
  - [ ] InsertBooking.gs（包含刪除功能）
  - [ ] CalendarIntegration.gs
  - [ ] Convert.gs
  - [ ] appsscript.json

### 3. 部署 Web App

- [ ] 開啟 https://script.google.com/
- [ ] 找到專案並開啟
- [ ] 點擊「部署」→「新增部署作業」
- [ ] 設定類型：「網頁應用程式」
- [ ] 設定執行身分：「我」
- [ ] 設定存取權限：**「任何人」**（重要！）
- [ ] 點擊「部署」
- [ ] 複製 Web App URL
- [ ] 儲存 URL 到安全的地方

## 前端配置

### 4. 設定 API 配置

- [ ] 開啟 `docs/config.js`
- [ ] 將 `YOUR_GAS_WEB_APP_URL_HERE` 替換為實際的 GAS Web App URL
- [ ] 確認 `SHEET_ID` 正確
- [ ] 儲存檔案

### 5. 測試前端（本地）

- [ ] 在本地開啟 `docs/index.html`（使用 Live Server 或本地伺服器）
- [ ] 檢查是否能載入初始資料
- [ ] 測試基本功能是否正常

## GitHub Pages 部署

### 6. 建立 GitHub Repository

- [ ] 登入 GitHub
- [ ] 建立新 repository（名稱：`pad-booking-system` 或自訂）
- [ ] 選擇 Public 或 Private
- [ ] 不要初始化 README、.gitignore 或 license

### 7. 推送代碼到 GitHub

使用 Git 命令列：

```bash
cd c:\Users\user\Documents\PadBookings
git init
git add docs/
git add .gitignore
git add README_NEW.md
git commit -m "Initial commit: Frontend for GitHub Pages"
git remote add origin https://github.com/YOUR_USERNAME/pad-booking-system.git
git branch -M main
git push -u origin main
```

- [ ] 執行上述命令
- [ ] 確認檔案已推送到 GitHub

### 8. 啟用 GitHub Pages

- [ ] 進入 GitHub repository
- [ ] 點擊「Settings」
- [ ] 左側選單選擇「Pages」
- [ ] Source 選擇：`Deploy from a branch`
- [ ] Branch 選擇：`main`，資料夾選擇：`/root`
- [ ] 點擊「Save」
- [ ] 等待 1-5 分鐘部署完成

### 9. 記錄 GitHub Pages URL

- [ ] 複製 GitHub Pages URL（例如：`https://YOUR_USERNAME.github.io/pad-booking-system/`）
- [ ] 測試網址是否可以存取

## 最終測試

### 10. 功能測試

- [ ] 開啟 GitHub Pages URL
- [ ] 檢查使用者 email 是否正確顯示
- [ ] 測試選擇日期和節次
- [ ] 測試設備可用性檢查
- [ ] 測試提交借用申請
- [ ] 檢查 Google Spreadsheet 是否有新資料
- [ ] 檢查 Google Calendar 是否建立事件
- [ ] 測試查看借用紀錄
- [ ] 測試設備狀況表
- [ ] 測試預約詳情顯示
- [ ] 測試刪除功能（管理員）

### 11. 除錯（如果有問題）

- [ ] 開啟瀏覽器開發者工具（F12）
- [ ] 檢查 Console 的錯誤訊息
- [ ] 檢查 Network 標籤的 API 請求
- [ ] 確認 GAS 部署設定正確
- [ ] 確認 config.js 的 URL 正確
- [ ] 檢查 GAS 執行記錄（Logs）

## 完成！

- [ ] 系統正常運作
- [ ] 文件已更新
- [ ] 管理員已知曉系統 URL
- [ ] 備份重要設定資訊

---

## 更新流程（日後維護）

### 更新前端
1. 修改 `docs/` 資料夾中的檔案
2. `git add docs/`
3. `git commit -m "描述更新內容"`
4. `git push`
5. 等待 GitHub Pages 自動部署

### 更新後端
1. 修改 `.gs` 檔案
2. `clasp push`
3. 在 GAS 編輯器：部署 → 管理部署作業 → 編輯 → 新版本 → 部署
4. URL 保持不變，前端不需修改

## 緊急聯絡資訊

- GAS 專案 URL: https://script.google.com/home/projects/[YOUR_PROJECT_ID]/edit
- Spreadsheet URL: https://docs.google.com/spreadsheets/d/12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw/edit
- GitHub Repository: https://github.com/YOUR_USERNAME/pad-booking-system
- GitHub Pages: https://YOUR_USERNAME.github.io/pad-booking-system/
