雲端文件:
https://docs.google.com/document/d/1UdZUPG6Ob7vi__DrhqKDIiipx6T_K828J4Ga8I7d5-Q/edit?usp=sharing

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
https://script.google.com/home/usersettings
clasp create --type webapp --title "LibGear"
clasp push
https://script.google.com/