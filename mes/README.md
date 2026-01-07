# MES Backup System (Google Apps Script Version)

這是一個基於 Google Apps Script (GAS) 的輕量級 MES 備援系統。
當主系統 (Angular) 發生故障或進行維護時，可切換至此系統進行緊急作業。

## 功能範圍
1.  **工單管理**：建立與查看工單 (Work Orders)。
2.  **現場派工**：針對工單進行派工 (Dispatches)。
3.  **生產報工**：作業員回報良品/NG數量 (Reports)。
4.  **資料同步**：所有資料儲存於 Google Sheets，方便後續匯出回主系統。

## 安裝步驟

### 1. 建立 Google Sheets 與 Script
1.  建立一個新的 **Google Spreadsheet**。
2.  點擊選單 `Extensions` (擴充功能) > `Apps Script`。

### 2. 複製程式碼
將本目錄下的檔案內容複製到 GAS 編輯器中對應的檔案：

| 本地檔案 | GAS 檔案名稱 | 說明 |
| --- | --- | --- |
| `Code.js` | `Code.gs` | 後端 API 邏輯 |
| `Database.js` | `Database.gs` | 資料庫操作邏輯 |
| `index.html` | `index.html` | 前端介面 (Vue.js) |

*注意：如果 GAS 編輯器中沒有該檔案，請按 `+` 新增 Script 或 HTML 檔案。*

### 3. 初始化資料庫
1.  在 GAS 編輯器中，從上方工具列的函式下拉選單選擇 `setup`。
2.  點擊 **執行 (Run)**。
3.  系統會要求授權 (Review Permissions)，請允許存取試算表。
4.  執行完畢後，回到 Google Sheets，您會看到系統已自動建立 `WorkOrders`, `Dispatches`, `Reports` 三個分頁。

### 4. 部署 Web App
1.  點擊右上角 `Deploy` (部署) > `New deployment` (新增部署)。
2.  **Select type**: `Web app`。
3.  **Description**: `MES Backup v1`。
4.  **Execute as**: `Me` (以我執行)。
5.  **Who has access**: 視需求選擇 `Anyone within [Domain]` (網域內所有人) 或 `Anyone with Google Account`。
6.  點擊 `Deploy`。
7.  複製產生的 **Web App URL**，這就是備援系統的網址。

## 使用說明
- 開啟 Web App URL 即可進入系統。
- 資料會即時寫入 Google Sheets。
- 若需匯回主系統，請將 Sheets 下載為 CSV/Excel，再由主系統匯入功能處理。
