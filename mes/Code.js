/**
 * Code.js - GAS 後端入口
 * v5.0.0 - 模組化架構 + Shoelace UI
 */

function doGet() {
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('SMAI - MES 線外表單')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 載入 HTML 模組 (用於 <?!= include('filename') ?>)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 取得目前部署的 Web App URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * 產生分享資訊（QR Code）
 */
function createShortUrl(longUrl) {
  if (!longUrl) {
    longUrl = getWebAppUrl();
  }

  return {
    longUrl: longUrl,
    shortUrl: longUrl,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(longUrl)
  };
}

function setup() {
  return initDatabase();
}

/**
 * 統一 API 處理入口
 */
function api(action, payload) {
  try {
    // 檢查資料庫連結 (除了 getVersion 和 getShortUrl 外都檢查)
    if (action !== 'getVersion' && action !== 'getShortUrl') {
      getDbSpreadsheet();
    }

    let result;
    switch (action) {
      case 'getVersion':
        return { success: true, data: '5.1.4' };
        
      // Work Orders
      case 'getWorkOrders':
        result = dbGetWorkOrders().filter(w => w.status !== 'cancelled');
        break;
      case 'createWorkOrder':
        result = dbCreateWorkOrder(payload);
        break;
      case 'updateWorkOrder':
        result = dbUpdateWorkOrder(payload.id, payload.data);
        break;
      case 'deleteWorkOrder':
        result = dbDeleteWorkOrder(payload.id);
        break;

      // Dispatches
      case 'getDispatches':
        result = dbGetDispatches().filter(d => d.status !== 'cancelled');
        break;
      case 'createDispatch':
        result = dbCreateDispatch(payload);
        break;
      case 'updateDispatch':
        result = dbUpdateDispatch(payload.id, payload.data);
        break;
      case 'deleteDispatch':
        result = dbDeleteDispatch(payload.id);
        break;
      case 'startDispatch':
        result = dbStartDispatch(payload.id);
        break;
      case 'completeDispatch':
        result = dbCompleteDispatch(payload.id);
        break;
        
      // Reports
      case 'getReports':
        result = dbGetReports();
        break;
      case 'createReport':
        result = dbCreateReport(payload);
        break;
        
      // EPC History
      case 'getEpcHistory':
        result = dbGetEpcHistory();
        break;
      case 'createEpcHistory':
        result = dbCreateEpcHistory(payload);
        break;
      case 'checkEpc':
        result = dbGetEpcLastRecord(payload.epc);
        break;
        
      // Operators
      case 'getOperators':
        // 只回傳啟用的人員
        result = dbGetOperators().filter(o => o.isActive !== 'FALSE' && o.isActive !== false);
        break;
      case 'createOperator':
        result = dbCreateOperator(payload);
        break;
      case 'updateOperator':
        result = dbUpdateOperator(payload.id, payload.data);
        break;
      case 'deleteOperator':
        result = dbDeleteOperator(payload.id);
        break;
        
      // Customers
      case 'getCustomers':
        result = dbGetCustomers().filter(c => c.isActive !== 'FALSE' && c.isActive !== false);
        break;
      case 'createCustomer':
        result = dbCreateCustomer(payload);
        break;
      case 'updateCustomer':
        result = dbUpdateCustomer(payload.id, payload.data);
        break;
      case 'deleteCustomer':
        result = dbDeleteCustomer(payload.id);
        break;

      // Products
      case 'getProducts':
        result = dbGetProducts().filter(p => p.isActive !== 'FALSE' && p.isActive !== false);
        break;
      case 'createProduct':
        result = dbCreateProduct(payload);
        break;
      case 'updateProduct':
        result = dbUpdateProduct(payload.id, payload.data);
        break;
      case 'deleteProduct':
        result = dbDeleteProduct(payload.id);
        break;

      // Outgassing Tests (釋氣檢驗)
      case 'getOutgassingTests':
        result = dbGetOutgassingTests();
        break;
      case 'createOutgassingTest':
        result = dbCreateOutgassingTest(payload);
        break;
      case 'getOutgassingSampleInfo':
        result = dbGetOutgassingSampleInfo(payload.workOrderId);
        break;

      // AOI Inspections (AOI 檢驗)
      case 'getAoiInspections':
        result = dbGetAoiInspections();
        break;
      case 'createAoiInspection':
        result = dbCreateAoiInspection(payload);
        break;
      case 'importAoiCsv':
        result = dbImportAoiCsv(payload.workOrderId, payload.csvRows, payload.operatorName);
        break;

      // Admin / Tools
      case 'fixStationName':
        result = dbFixStationName();
        break;
      case 'generateTestData':
        result = dbGenerateTestData();
        break;
      case 'syncDatabase':
        result = initDatabase();
        break;
      case 'fixColumnOrder':
        result = dbFixColumnOrder();
        break;
      case 'fixSignatureData':
        result = dbFixSignatureData();
        break;

      case 'getShortUrl':
        result = createShortUrl(payload.url);
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