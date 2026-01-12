# 專案架構說明

## 📁 檔案結構

```
PadBookings/
│
├── 📂 docs/                        ← GitHub Pages 前端檔案
│   ├── index.html                 ← 主頁面（純 HTML，無模板語法）
│   ├── app.js                     ← 前端邏輯和 API 呼叫
│   ├── config.js                  ← API 配置（需設定 GAS URL）
│   └── styles.css                 ← 樣式表
│
├── 📂 Google Apps Script 檔案     ← 後端 API 服務
│   ├── index_api.gs               ← API 端點主檔案（新）
│   ├── InsertBooking.gs           ← 資料處理與驗證
│   ├── CalendarIntegration.gs     ← Google Calendar 整合
│   ├── Convert.gs                 ← 資料轉換工具
│   └── appsscript.json            ← GAS 專案配置
│
├── 📂 舊版檔案（保留參考）
│   ├── index.gs                   ← 舊版 GAS 主檔案
│   └── Bookings.html              ← 舊版 HTML 模板
│
└── 📂 文件
    ├── README.md                  ← 原始說明（保留）
    ├── README_NEW.md              ← 新版完整說明 ⭐
    ├── QUICKSTART.md              ← 快速開始指南 ⭐
    ├── DEPLOYMENT_CHECKLIST.md    ← 部署檢查清單 ⭐
    ├── .gitignore                 ← Git 忽略清單
    └── ARCHITECTURE.md            ← 本文件
```

## 🏗️ 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                         使用者                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   前端（GitHub Pages）                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index.html    ←  靜態 HTML 頁面                      │  │
│  │  app.js        ←  前端邏輯、API 呼叫                  │  │
│  │  config.js     ←  API 配置                            │  │
│  │  styles.css    ←  樣式表                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ▲                                    │
│                         │ Fetch API (AJAX)                  │
│                         ▼                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                    HTTPS 請求
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              後端（Google Apps Script）                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  index_api.gs         ←  API 路由                     │  │
│  │    ├─ doGet()         ←  處理 GET 請求                │  │
│  │    └─ doPost()        ←  處理 POST 請求               │  │
│  │                                                        │  │
│  │  InsertBooking.gs     ←  資料處理                     │  │
│  │    ├─ updateSheet()   ←  新增借用                     │  │
│  │    ├─ getBookingsByDate()                             │  │
│  │    ├─ getAvailableGears()                             │  │
│  │    └─ deleteBookingRecord()  ← 刪除預約               │  │
│  │                                                        │  │
│  │  CalendarIntegration.gs  ←  日曆整合                  │  │
│  │    └─ createCalendarEventsNew()                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ▼                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Google 服務                                │
│  ┌───────────────────────┐  ┌───────────────────────────┐  │
│  │  Google Sheets        │  │  Google Calendar          │  │
│  │  (資料存儲)            │  │  (行事曆同步)              │  │
│  └───────────────────────┘  └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 資料流程

### 1. 載入頁面
```
使用者 → GitHub Pages → 載入 index.html
                      → 載入 app.js
                      → 執行 loadInitialData()
                      → 呼叫 GAS API (GET)
                      → 回傳初始資料
                      → 渲染頁面
```

### 2. 提交借用申請
```
使用者填寫表單 → submitInput()
               → 驗證資料
               → 呼叫 GAS API (POST /updateSheet)
               → updateSheet() 處理資料
               → 寫入 Spreadsheet
               → createCalendarEventsNew()
               → 回傳成功訊息
               → 更新頁面顯示
```

### 3. 檢查設備可用性
```
選擇日期/節次 → checkGearAvailability()
              → 呼叫 GAS API (POST /getAvailableGears)
              → 查詢 Spreadsheet
              → 計算設備可用性
              → 回傳結果
              → 更新 UI 顯示
```

## 🔑 關鍵 API 端點

| 端點 | 方法 | 功能 | 參數 |
|------|------|------|------|
| `?action=getInitData` | GET | 取得初始資料 | 無 |
| `?action=getBookingsByDate` | POST | 取得特定日期的借用記錄 | `{ date: "YYYY-MM-DD" }` |
| `?action=getAvailableGears` | POST | 檢查設備可用性 | `{ date, periods[] }` |
| `?action=updateSheet` | POST | 新增借用記錄 | `{ booking_date, className, ... }` |
| `?action=getGearStatus` | POST | 取得設備狀況 | `{ date: "YYYY-MM-DD" }` |
| `?action=deleteBooking` | POST | 刪除預約記錄 | `{ booking: [...] }` |

## 🔐 權限控制

### 前端
- **公開存取**：任何人都可以查看和提交借用申請
- **GitHub Pages**：靜態網站，無伺服器端權限控制

### 後端
- **GAS 執行身分**：使用部署者的權限
- **Spreadsheet 存取**：自動繼承部署者權限
- **Calendar 存取**：需要日曆 ID 的寫入權限
- **刪除功能**：僅限管理員（email 驗證）

## 📊 資料結構

### Spreadsheet: Bookings
| 欄位 | 索引 | 說明 |
|------|------|------|
| 提交時間 | 0 | timestamp |
| 借用日期 | 1 | YYYY-MM-DD |
| 班級 | 2 | 例：高一仁 |
| 借用教師 | 3 | 教師姓名 |
| 課程名稱 | 4 | 科目/課程 |
| 其他說明 | 5 | 選填 |
| 節次 | 6 | 例：第1節 |
| 設備 | 7 | 設備名稱 |

### Spreadsheet: Gears
| 欄位 | 索引 | 說明 |
|------|------|------|
| ID | 0 | 設備 ID |
| 名稱 | 1 | 設備名稱 |
| 描述 | 2 | 說明文字 |
| 可見 | 3 | TRUE/FALSE |

### Spreadsheet: Periods
| 欄位 | 索引 | 說明 |
|------|------|------|
| 序號 | 0 | 節次序號 |
| ID | 1 | HTML ID |
| 名稱 | 2 | 顯示名稱 |

## 🔧 配置說明

### config.js
```javascript
const API_CONFIG = {
    // GAS Web App URL（部署後取得）
    BASE_URL: 'https://script.google.com/macros/s/{SCRIPT_ID}/exec',
    
    // Google Spreadsheet ID
    SHEET_ID: '12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw'
};
```

### appsscript.json
```json
{
  "timeZone": "Asia/Taipei",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

## 🚀 部署特點

### 前端（GitHub Pages）
✅ **靜態託管**：無伺服器成本  
✅ **自動部署**：Git push 即部署  
✅ **CDN 加速**：全球快速存取  
✅ **HTTPS 安全**：自動提供 SSL  

### 後端（Google Apps Script）
✅ **無伺服器**：Google 管理基礎設施  
✅ **自動擴展**：根據請求量自動調整  
✅ **整合性強**：原生存取 Google 服務  
✅ **免費配額**：每日 20,000 次呼叫  

## 📈 未來擴展方向

1. **前端優化**
   - 使用 Vue.js/React 框架
   - 加入 PWA 支援（離線功能）
   - 實作客戶端快取

2. **後端優化**
   - 實作快取機制
   - 加入 webhook 通知
   - 批次操作優化

3. **功能擴展**
   - 使用者認證
   - 權限分級
   - 資料統計報表
   - 匯出功能

## 📞 支援與維護

- **文件**：參閱 README_NEW.md
- **快速開始**：參閱 QUICKSTART.md
- **部署**：參閱 DEPLOYMENT_CHECKLIST.md
- **問題回報**：聯繫系統管理員
