# GAS 專案開發規範

> 此為 Google Apps Script 專案專用規範，與全域 CLAUDE.md 合併使用

## 部署設定

### 固定部署 ID（重要）

| 專案 | 部署 ID | 用途 |
|------|---------|------|
| MES | `AKfycbwbX1uACKWhzRhe8JxlXwKEWbZ7ysduAQtf2R2drxIZm5X6acMX7WFUMEpCGouPELoKYw` | 生產環境 |
| KPI | `AKfycbx_N5BFUGoQxD9n87vNm9A0Iy8uwJHRkSDp4gEo4daDPeyMglV5sRxzW_sqXQ0G5A0K` | 生產環境 |

### 部署指令

```bash
# 推送程式碼
clasp push

# 更新現有部署（保持網址不變）
clasp deploy -i <DEPLOYMENT_ID> -d "版本說明"

# 禁止：建立新部署（會產生新網址）
# clasp deploy  # 不要用這個！
```

## 技術架構

### 檔案結構

```
project/
├── appsscript.json    # GAS 設定
├── Code.js            # 後端入口 (doGet, doPost, api)
├── Database.js        # 資料庫 CRUD
├── index.html         # 主頁面框架
├── styles.html        # CSS 樣式
├── app.html           # Vue 應用程式
├── modals.html        # Modal 對話框
└── tab-*.html         # 各功能頁籤
```

### 前端框架

- **Vue 3 CDN** + **Shoelace Web Components**
- 不使用建置工具，直接部署

### API 格式

```javascript
// 統一回應格式
{ success: true, data: result }
{ success: false, error: "錯誤訊息" }

// 前端呼叫
google.script.run
  .withSuccessHandler(res => { if (res.success) ... })
  .withFailureHandler(err => ...)
  .api(action, payload);
```

## 常見問題與解決方案

### 1. Shoelace 元件綁定失效

**問題**：Vue 的 `v-model` 對 Web Components 無效

**解決**：改用 `:value` + `@sl-input` / `@sl-change`

```html
<!-- 錯誤 -->
<sl-input v-model="formData.name"></sl-input>

<!-- 正確 -->
<sl-input :value="formData.name" @sl-input="e => formData.name = e.target.value"></sl-input>
<sl-select :value="formData.type" @sl-change="e => formData.type = e.target.value"></sl-select>
<sl-checkbox :checked="formData.active" @sl-change="e => formData.active = e.target.checked"></sl-checkbox>
```

**必須設定**：在 app.html 的 Vue 初始化加入：

```javascript
app.config.compilerOptions.isCustomElement = tag => tag.startsWith('sl-');
app.mount('#app');
```

### 2. 部署後版本未更新

**問題**：網頁顯示舊版本號

**檢查清單**：
1. Code.js 的 `getVersion` case 是否已更新版本號
2. 是否使用正確的部署 ID（`clasp deploy -i <ID>`）
3. 瀏覽器是否有快取（Ctrl+Shift+R 強制重新整理）

```javascript
// Code.js - 記得更新版本號
case 'getVersion':
  return { success: true, data: '5.2.8' };  // 更新這裡
```

### 3. clasp deploy 產生新網址

**問題**：執行 `clasp deploy` 後網址改變

**原因**：未指定部署 ID 會建立新部署

**解決**：永遠使用 `-i` 參數指定部署 ID

```bash
# 正確
clasp deploy -i AKfycbwbX1uACKWhzRhe8JxlXwKEWbZ7ysduAQtf2R2drxIZm5X6acMX7WFUMEpCGouPELoKYw -d "版本說明"

# 錯誤（會產生新網址）
clasp deploy -d "版本說明"
```

### 4. API 無法用 curl 測試

**問題**：GAS Web App 對外部 POST 請求有 CORS 限制

**解決方案**：
- 使用 Puppeteer 模擬瀏覽器操作
- 或在 GAS 內建立測試函數直接執行

```javascript
// 測試用函數
function testApi() {
  const result = api('getWorkOrders', {});
  Logger.log(JSON.stringify(result));
}
```

### 5. Spreadsheet 欄位順序錯亂

**問題**：手動編輯 Spreadsheet 後欄位對應錯誤

**預防**：
- 不要手動調整 Spreadsheet 欄位順序
- 使用「修復欄位順序」功能（設定頁）
- Database.js 的 SCHEMA 定義是唯一真相來源

### 6. 簽名資料未儲存

**問題**：Canvas 簽名沒有存入資料庫

**檢查**：
1. `endSign()` 是否有將 `canvas.toDataURL()` 存入表單
2. 表單提交時是否有包含 signature 欄位
3. Database.js 的 SCHEMA 是否有 signature 欄位

### 7. CSV 匯入格式問題

**問題**：AOI 機台匯出的 CSV 格式異常（所有資料在第一欄引號內）

**解決**：app.html 的 `handleAoiCsvFile` 已處理此格式

```javascript
// 檢測是否為 AOI 格式
const isAoiFormat = headers.includes('日期') || headers.includes('序號');
if (isAoiFormat) {
  // 特殊解析邏輯
}
```

### 8. 手機版頁籤無法滾動/溢出

**問題**：手機版頁籤太多時看不到、無法點擊

**原因**：`.tabs-nav` 或 `.schedule-tabs` 缺少 `overflow-x: auto`

**解決**：確保所有橫向導航元件都有以下樣式：

```css
@media (max-width: 640px) {
  .tabs-nav,
  .schedule-tabs {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nav-tab,
  .schedule-tab {
    flex-shrink: 0;
    white-space: nowrap;
  }
}
```

### 9. 手機版內容溢出（出框）

**問題**：手機瀏覽時內容超出螢幕邊界，出現水平滾動條

**常見溢出元素**：
- `.split-layout` 子元素（釋氣檢驗、AOI 檢驗等頁面）
- `.data-table` 表格
- `.alert`, `.csv-preview`, `.info-grid` 區塊
- 表單元素 input/select/textarea

**解決方案**：

```css
/* 全域防止溢出 */
html, body {
  overflow-x: hidden;
  width: 100%;
}

/* Grid 子元素必須設定 min-width: 0 */
.split-layout > div {
  min-width: 0;
  overflow-x: hidden;
}

/* 手機版 media query 內添加 */
@media (max-width: 640px) {
  .split-layout > div,
  .form-section,
  .alert,
  .csv-preview,
  .info-grid {
    max-width: 100%;
    overflow-x: hidden;
    word-wrap: break-word;
  }

  input, select, textarea {
    max-width: 100%;
  }

  .data-table {
    min-width: 500px; /* 讓表格可橫向滾動 */
  }

  .scrollable {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

### 10. 手機版 UI 測試必須檢查所有頁籤（重要）

**問題**：只測試首頁會遺漏其他頁籤的溢出問題

**必須測試的頁籤**：
1. 排程看板（含子頁籤：排程總覽、生產排程、人員排班、設備排程）
2. 工單管理
3. 現場派工
4. 報工紀錄
5. 釋氣檢驗 ← 常見溢出
6. AOI 檢驗 ← 常見溢出
7. 標籤管理
8. 樣式設計
9. 烘箱監控
10. 倉儲管理
11. 設定

**完整測試腳本**：
```bash
cd /Users/dash/Documents/github/MES && node -e "
const puppeteer = require('puppeteer');
const TABS = ['schedule', 'workorders', 'dispatches', 'reports', 'outgassing', 'aoi', 'rfid', 'label', 'oven', 'wms', 'settings'];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 812, isMobile: true });

  await page.goto('https://script.google.com/macros/s/AKfycbwbX1uACKWhzRhe8JxlXwKEWbZ7ysduAQtf2R2drxIZm5X6acMX7WFUMEpCGouPELoKYw/exec', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 10000));

  const results = [];
  for (const tab of TABS) {
    await page.evaluate(t => { if (window.app) window.app.currentTab = t; }, tab);
    await new Promise(r => setTimeout(r, 1500));

    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    results.push({ tab, overflow });

    if (overflow) {
      await page.screenshot({ path: '/tmp/mes-overflow-' + tab + '.png', fullPage: true });
    }
  }

  console.log('測試結果:');
  results.forEach(r => console.log(r.tab + ': ' + (r.overflow ? 'X 溢出' : 'O 正常')));

  const failed = results.filter(r => r.overflow);
  if (failed.length > 0) {
    console.log('\\n溢出頁籤截圖已儲存至 /tmp/mes-overflow-*.png');
    process.exit(1);
  }

  await browser.close();
})();
"
```

**使用 DashAI DevTools**：
```bash
# 手機版 E2E 測試（僅檢查首頁）
dash e2e <URL> --mobile

# 完整測試需使用上方腳本
```

## 版本更新 SOP

1. 修改程式碼
2. 更新 Code.js 版本號
3. `clasp push`
4. `clasp deploy -i <DEPLOYMENT_ID> -d "版本說明"`
5. 重新整理網頁確認版本號
6. 測試功能

## 測試方式

### Puppeteer 截圖測試

```bash
cd /Users/dash/Documents/github/MES && node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec', { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  await browser.close();
})();
"
```

### GAS 內部測試

```javascript
// 在 GAS 編輯器執行
function testFunction() {
  const result = dbGetWorkOrders();
  Logger.log(JSON.stringify(result));
}
```
