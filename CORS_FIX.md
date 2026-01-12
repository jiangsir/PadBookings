# CORS 問題修復指南

## 問題說明
錯誤訊息：`Access to fetch has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present`

這是因為 Google Apps Script Web App 的部署設定不正確。

## 修復步驟

### 1. 開啟 Google Apps Script 編輯器
訪問：https://script.google.com/home

### 2. 找到您的專案並開啟

### 3. 更新 Code.gs
- 將修改後的 `/backend/Code.gs` 內容完整複製
- 貼上到 Google Apps Script 編輯器中
- 儲存（Ctrl+S 或 ⌘+S）

### 4. 重新部署（關鍵步驟）

#### 4.1 刪除舊部署（如果存在）
1. 點擊右上角「部署」→「管理部署」
2. 點擊舊部署旁的垃圾桶圖示刪除

#### 4.2 建立新部署
1. 點擊右上角「部署」→「新增部署」
2. 點擊「選取類型」→「網頁應用程式」
3. 設定如下：
   - **說明**：PadBookings API（或任意名稱）
   - **執行身分**：**我**（重要！）
   - **具有存取權的使用者**：**任何人**（重要！）
4. 點擊「部署」
5. 首次部署需要授權：
   - 點擊「授權存取」
   - 選擇您的 Google 帳號
   - 點擊「進階」→「前往 [專案名稱]（不安全）」
   - 點擊「允許」

### 5. 複製新的 Web App URL
- 部署完成後會顯示一個新的 URL
- 格式：`https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
- **如果 URL 與現有的不同，需要更新 `docs/js/config.js` 中的 `API_URL`**

### 6. 測試
1. 開啟瀏覽器開發者工具（F12）
2. 訪問 https://jiangsir.github.io/PadBookings/
3. 檢查 Console，應該不再有 CORS 錯誤

## 檢查清單

- [ ] Code.gs 已更新並儲存
- [ ] 舊部署已刪除
- [ ] 新部署已建立
- [ ] **執行身分** 設為「我」
- [ ] **具有存取權的使用者** 設為「任何人」
- [ ] 授權已完成
- [ ] config.js 中的 API_URL 已更新（如果 URL 改變）
- [ ] 瀏覽器中測試成功

## 常見問題

### Q1: 仍然出現 CORS 錯誤？
A: 確認「具有存取權的使用者」設定為「任何人」，而不是「僅限我自己」

### Q2: 錯誤：未授權
A: 確認「執行身分」設定為「我」

### Q3: 需要清除瀏覽器快取嗎？
A: 建議使用無痕模式測試，或清除快取後重新載入

### Q4: URL 改變了怎麼辦？
A: 編輯 `docs/js/config.js`，將新的 URL 更新到 `API_URL` 欄位

## 部署設定截圖說明

正確的設定應該是：
```
類型：網頁應用程式
執行身分：我
具有存取權的使用者：任何人
```

這樣設定後，Google Apps Script 會自動添加正確的 CORS headers，允許來自任何來源的請求。
