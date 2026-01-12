# 🚀 部署前必讀

## ⚠️ 重要提示

在部署前端到 GitHub Pages 之前，請先完成以下設定：

---

## 步驟 1: 部署 Google Apps Script 後端

1. 前往 [Google Apps Script](https://script.google.com/)
2. 點擊「新專案」
3. 複製 `backend/Code.gs` 的內容
4. 配置試算表 ID 和日曆 ID
5. 部署為 Web App
6. **複製 Web App URL**

---

## 步驟 2: 配置前端 API URL

編輯 `frontend/js/config.js` 文件：

```javascript
const API_CONFIG = {
    API_URL: 'YOUR_GAS_WEB_APP_URL_HERE',  // 👈 在這裡貼上你的 Web App URL
    ...
};
```

**⚠️ 如果沒有設定 API_URL，前端將無法正常工作！**

---

## 步驟 3: 測試本地運行

在部署到 GitHub Pages 之前，建議先在本地測試：

1. 使用 VS Code 的 Live Server 擴展打開 `index.html`
2. 或使用任何本地 HTTP 服務器
3. 確認所有功能正常運作

---

## 步驟 4: 部署到 GitHub Pages

1. 在 GitHub 創建新 repository
2. 推送 frontend 資料夾內容
3. 在 Repository Settings 中啟用 GitHub Pages
4. 訪問你的網站！

---

## 📚 詳細文檔

請參閱 [README.md](../README.md) 獲取完整的部署說明。
