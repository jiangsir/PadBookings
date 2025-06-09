雲端文件:
https://docs.google.com/document/d/1UdZUPG6Ob7vi__DrhqKDIiipx6T_K828J4Ga8I7d5-Q/edit?usp=sharing

資料庫:
https://docs.google.com/spreadsheets/d/12NlutBJAq7HkIO7OE0E5UhpMqE7demarGTlVK5ZD1Sw/edit?usp=sharing

進入環境:
列出現有環境
conda env list

創建一個新的環境
conda create -n appsscript

切換進入 appsscript
conda activate appsscript

使用 clasp 進行本地開發
node -v
npm install -g @google/clasp
clasp login
555@tea.nknush.kh.edu.tw

https://script.google.com/home/usersettings
確保 Google Apps Script API 是開啟的

clasp create --type webapp --title "LibGear"

clasp push --force

https://script.google.com/

* 部屬
    1. 手動部屬成"網頁應用程式"
    https://script.google.com/home/projects/1SyJdsOSKKdEElKYxfLOcYSrEw7Babnc9KtcC9go8xgrm33hZOtHiK_3R/edit
    並取得 URL 觀看結果。
    
    2. 自動部屬
    先安裝 npm install googleapis google-auth-library
    
    https://console.cloud.google.com/
    YOUR_CLIENT_ID，YOUR_CLIENT_SECRET 和 YOUR_REDIRECT_URI 應該由你的 Google Cloud Console 項目中的 OAuth 2.0 客戶端 ID 頁面提供