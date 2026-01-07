/**
 * Code.js - KPI 管理定義盤點系統 後端入口
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('KPI 管理定義盤點 - 再生部')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 取得目前部署的 Web App URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * 產生短網址 (使用 is.gd API)
 */
function createShortUrl(longUrl) {
  if (!longUrl) {
    longUrl = getWebAppUrl();
  }

  try {
    const apiUrl = 'https://is.gd/create.php?format=simple&url=' + encodeURIComponent(longUrl);
    const response = UrlFetchApp.fetch(apiUrl);
    const shortUrl = response.getContentText().trim();

    return {
      longUrl: longUrl,
      shortUrl: shortUrl,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(shortUrl)
    };
  } catch (e) {
    console.error('短網址產生失敗:', e);
    return {
      longUrl: longUrl,
      shortUrl: longUrl,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(longUrl)
    };
  }
}

function setup() {
  return initDatabase();
}

/**
 * 設定管理員帳密（在 GAS 編輯器執行一次）
 */
function setAdminCredentials(account, password) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('ADMIN_ACCOUNT', account);
  props.setProperty('ADMIN_PASSWORD', password);
  return { success: true, message: '管理員帳密已設定' };
}

/**
 * 統一 API 處理入口
 */
function api(action, payload) {
  try {
    if (action !== 'getVersion' && action !== 'getShortUrl') {
      getDbSpreadsheet();
    }

    let result;
    switch (action) {
      case 'getVersion':
        return { success: true, data: '2.2.0' };

      case 'getShortUrl':
        return { success: true, data: createShortUrl(payload?.url) };

      case 'login':
        result = dbVerifyLogin(payload.account, payload.password);
        break;

      case 'getSummary':
        result = dbGetKpiSummary();
        break;

      case 'getKpis':
        result = dbGetKpis(payload?.account, payload?.password);
        break;
      case 'createKpi':
        result = dbCreateKpi(payload);
        break;
      case 'updateKpi':
        result = dbUpdateKpi(payload.id, payload.data, payload.account, payload.password);
        break;
      case 'deleteKpi':
        result = dbDeleteKpi(payload.id, payload.account, payload.password);
        break;

      case 'syncDatabase':
        result = initDatabase();
        break;

      default:
        throw new Error('Unknown action: ' + action);
    }
    return { success: true, data: result };
  } catch (e) {
    console.error(e);
    return { success: false, error: e.toString() };
  }
}
