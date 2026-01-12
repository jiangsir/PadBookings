# 快速開始指南

## 🚀 三步驟完成部署

### 步驟 1：部署 Google Apps Script 後端

1. 開啟終端機，執行：
   ```bash
   cd c:\Users\user\Documents\PadBookings
   clasp push --force
   ```

2. 開啟 https://script.google.com/
   - 找到您的專案並開啟
   - 點擊「部署」→「新增部署作業」
   - 類型：「網頁應用程式」
   - 執行身分：「我」
   - 存取權限：**「任何人」** ⚠️ 必須選這個！
   - 點擊「部署」
   - **複製 Web App URL** 並儲存

### 步驟 2：設定前端 API 配置

編輯 `docs/config.js`，將：
```javascript
BASE_URL: 'YOUR_GAS_WEB_APP_URL_HERE',
```
替換為實際的 GAS Web App URL（步驟1取得的）

### 步驟 3：部署到 GitHub Pages

1. 在 GitHub 建立新 repository（名為 `pad-booking-system`）

2. 執行以下命令：
   ```bash
   git init
   git add docs/ .gitignore README_NEW.md
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/pad-booking-system.git
   git branch -M main
   git push -u origin main
   ```

3. 在 GitHub 啟用 Pages：
   - Settings → Pages
   - Branch: `main`，資料夾: `/root`
   - Save

4. 等待 1-5 分鐘，存取：
   `https://YOUR_USERNAME.github.io/pad-booking-system/`

## ✅ 完成！

系統現已上線，前端和後端分別部署在：
- **前端**：GitHub Pages（靜態網站）
- **後端**：Google Apps Script（API 服務）

## 📝 重要提醒

1. **GAS 部署時務必選擇「任何人」存取**，否則會有 CORS 錯誤
2. **保存好 GAS Web App URL**，未來更新時需要用到
3. **每次更新 GAS 時建立新版本**，這樣 URL 不會改變

## 🔧 測試清單

- [ ] 能看到使用者 email
- [ ] 能選擇日期和節次
- [ ] 能檢查設備可用性
- [ ] 能提交借用申請
- [ ] 資料有寫入 Spreadsheet
- [ ] 日曆有建立事件

## 🆘 遇到問題？

常見錯誤及解決方法：

| 錯誤 | 原因 | 解決 |
|------|------|------|
| CORS error | GAS 權限設定錯誤 | 重新部署 GAS，選擇「任何人」 |
| 403 Forbidden | API URL 錯誤 | 檢查 config.js 的 BASE_URL |
| 資料無法載入 | Spreadsheet ID 錯誤 | 確認 SHEET_ID 正確 |
| 網頁沒更新 | 瀏覽器快取 | 按 Ctrl+F5 強制重新整理 |

詳細說明請參閱 [README_NEW.md](README_NEW.md)
