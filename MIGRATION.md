# 專案重構說明

## 原始檔案說明

以下是原始專案中的檔案，**已經被新的前後端分離架構取代，可以安全刪除**：

### 可以刪除的檔案

- `Bookings.html` - 原始的 GAS 模板檔案，已被 `frontend/index.html` 取代
- `index.gs` - 原始的 GAS 主程式，已被 `backend/Code.gs` 整合
- `InsertBooking.gs` - 原始的 GAS 插入功能，已被 `backend/Code.gs` 整合
- `CalendarIntegration.gs` - 原始的日曆整合功能，已被 `backend/Code.gs` 整合
- `Convert.gs` - 原始的數據轉換功能（如已不需要可刪除）
- `appsscript.json` - 原始的 GAS 配置檔，已被 `backend/appsscript.json` 取代

### 新的檔案結構

```
PadBookings/
├── frontend/              # 🆕 前端靜態文件
│   ├── index.html        # 取代 Bookings.html
│   ├── css/
│   │   └── style.css     # 從 Bookings.html 中提取
│   └── js/
│       ├── config.js     # 🆕 API 配置
│       ├── api-client.js # 🆕 API 客戶端
│       └── app.js        # 🆕 主邏輯，從 Bookings.html 中提取
│
├── backend/              # 🆕 後端 API
│   ├── Code.gs          # 整合所有 .gs 檔案
│   └── appsscript.json  # GAS 配置
│
└── README.md            # 更新的部署說明
```

## 主要變更

### 1. 前端變更

**之前**：
- 使用 GAS 模板語法 (`<?= ... ?>`)
- 直接調用 `google.script.run`
- 所有代碼混在一個 HTML 檔案中

**之後**：
- 純靜態 HTML/CSS/JavaScript
- 使用 RESTful API 調用
- 模組化代碼結構

### 2. 後端變更

**之前**：
- 多個 .gs 檔案分散功能
- 使用 `doGet()` 返回 HTML

**之後**：
- 單一 API 檔案 `Code.gs`
- `doGet()` 和 `doPost()` 返回 JSON
- RESTful API 設計

### 3. 部署變更

**之前**：
- 完全依賴 GAS 部署
- URL 為 GAS Web App URL
- 無法使用自定義域名

**之後**：
- 前端可部署到任何靜態主機
- GitHub Pages、Netlify、Vercel 等
- 可使用自定義域名

## 遷移步驟

### 如果你想保留舊版本

1. 創建一個備份分支：
```bash
git checkout -b backup-original
git add .
git commit -m "Backup original version"
```

2. 回到主分支刪除舊檔案：
```bash
git checkout main
git rm Bookings.html index.gs InsertBooking.gs CalendarIntegration.gs appsscript.json
git commit -m "Remove old files, migrate to frontend/backend structure"
```

### 如果你確定不需要舊版本

直接刪除舊檔案即可：

```bash
# Windows PowerShell
Remove-Item Bookings.html, index.gs, InsertBooking.gs, CalendarIntegration.gs, appsscript.json

# Linux/Mac
rm Bookings.html index.gs InsertBooking.gs CalendarIntegration.gs appsscript.json
```

## 數據遷移

**好消息**: 不需要數據遷移！

新系統使用相同的 Google Spreadsheet 結構，所有現有數據都可以直接使用。

## 測試清單

在刪除舊檔案之前，請確認：

- [ ] 後端 API 已成功部署到 GAS
- [ ] 前端 `config.js` 已正確配置 API URL
- [ ] 可以正常載入設備列表
- [ ] 可以正常載入節次列表
- [ ] 可以正常查看借用記錄
- [ ] 可以正常提交新的借用申請
- [ ] 設備可用性檢查功能正常
- [ ] 日曆同步功能正常（如果啟用）
- [ ] 管理員刪除功能正常（如果是管理員）

## 回滾計劃

如果新系統出現問題，可以快速回滾：

1. 如果有備份分支：
```bash
git checkout backup-original
```

2. 在 GAS 中重新部署舊版本的 `index.gs` 等檔案

## 支援

如有任何問題，請參考：
- [README.md](README.md) - 完整部署指南
- [frontend/DEPLOY.html](frontend/DEPLOY.html) - 快速部署說明

## 優勢總結

新架構的優勢：

✅ **更好的維護性** - 前後端分離，代碼更清晰
✅ **更快的載入速度** - 靜態文件可利用 CDN
✅ **更靈活的部署** - 前端可部署到任何地方
✅ **更好的開發體驗** - 可以使用現代前端工具
✅ **更容易擴展** - API 設計更規範
✅ **更安全** - 前後端分離減少安全風險
