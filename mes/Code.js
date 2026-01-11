/**
 * Code.js - GAS 後端入口
 * v5.47.0 - 雙入口架構（作業員端/管理端）
 */

/**
 * 主入口：依 mode 參數決定作業員端或管理端
 * - exec → 作業員端（不需登入）
 * - exec?mode=admin → 管理端（需 Google 帳號 + admin 角色）
 */
function doGet(e) {
  const mode = e?.parameter?.mode || 'operator';

  // 管理端需驗證 Google 帳號
  if (mode === 'admin') {
    const user = Session.getActiveUser().getEmail();

    if (!user) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family: sans-serif; padding: 2rem; text-align: center;">' +
        '<h2>請先登入 Google 帳號</h2>' +
        '<p style="color: #666;">管理端需要 Google 帳號驗證</p>' +
        '</div>'
      ).setTitle('MES 管理端 - 需要登入');
    }

    // 檢查是否為管理員（Operators.role = 'admin'）
    try {
      const operators = dbGetOperators();
      const isAdmin = operators.some(op =>
        op.role === 'admin' &&
        op.isActive !== false &&
        op.isActive !== 'FALSE' &&
        (op.email === user || op.code === user.split('@')[0])
      );

      if (!isAdmin) {
        return HtmlService.createHtmlOutput(
          '<div style="font-family: sans-serif; padding: 2rem; text-align: center;">' +
          '<h2>權限不足</h2>' +
          '<p style="color: #666;">帳號 ' + user + ' 沒有管理員權限</p>' +
          '<p style="margin-top: 1rem;"><a href="' + ScriptApp.getService().getUrl() + '">返回作業員端</a></p>' +
          '</div>'
        ).setTitle('MES 管理端 - 權限不足');
      }
    } catch (err) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family: sans-serif; padding: 2rem; text-align: center;">' +
        '<h2>系統錯誤</h2>' +
        '<p style="color: #666;">' + err.toString() + '</p>' +
        '</div>'
      ).setTitle('MES 管理端 - 錯誤');
    }
  }

  // 建立模板並傳遞參數
  const template = HtmlService.createTemplateFromFile('index');
  template.appMode = mode;
  template.userEmail = mode === 'admin' ? Session.getActiveUser().getEmail() : '';

  return template.evaluate()
      .setTitle(mode === 'admin' ? 'MES 管理端' : 'MES 作業員端')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 處理 POST 請求（外部 API 呼叫）
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const result = api(data.action, data.payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
 * 產生分享資訊（短網址 + QR Code）
 */
function createShortUrl(longUrl) {
  // 固定部署網址（避免 getWebAppUrl 返回 null）
  const DEPLOYED_URL = 'https://script.google.com/macros/s/AKfycbwbX1uACKWhzRhe8JxlXwKEWbZ7ysduAQtf2R2drxIZm5X6acMX7WFUMEpCGouPELoKYw/exec';

  if (!longUrl) {
    longUrl = getWebAppUrl() || DEPLOYED_URL;
  }

  let shortUrl = longUrl;

  // 使用 TinyURL API 產生短網址
  try {
    const response = UrlFetchApp.fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longUrl), {
      muteHttpExceptions: true,
      followRedirects: true
    });
    const code = response.getResponseCode();
    const text = response.getContentText().trim();

    if (code === 200 && text.startsWith('http')) {
      shortUrl = text;
    }
  } catch (e) {
    console.error('短網址產生失敗:', e.toString());
    // 失敗時使用原始網址
  }

  return {
    longUrl: longUrl,
    shortUrl: shortUrl,
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(shortUrl)
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
        return { success: true, data: '5.47.1' };

      // 效能優化：單次載入所有資料 (含快取)
      case 'getAllData':
        result = getAllDataWithCache();
        break;

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

      // Parts (物料主檔)
      case 'getParts':
        result = dbGetParts().filter(p => p.isActive !== 'FALSE' && p.isActive !== false);
        break;
      case 'createPart':
        result = dbCreatePart(payload);
        break;
      case 'updatePart':
        result = dbUpdatePart(payload.id, payload.data);
        break;
      case 'deletePart':
        result = dbDeletePart(payload.id);
        break;

      // NG Reasons (NG 原因管理)
      case 'getNgReasons':
        result = dbGetNgReasons().filter(r => r.isActive !== 'FALSE' && r.isActive !== false);
        break;
      case 'createNgReason':
        result = dbCreateNgReason(payload);
        break;
      case 'updateNgReason':
        result = dbUpdateNgReason(payload.id, payload.data);
        break;
      case 'deleteNgReason':
        result = dbDeleteNgReason(payload.id);
        break;

      // NG Details (NG 明細)
      case 'createNgDetail':
        result = dbCreateNgDetail(payload);
        break;
      case 'getNgDetailsByReport':
        result = dbGetNgDetailsByReport(payload.reportId);
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

      // R0 Labels (跨裝置同步)
      case 'getR0Labels':
        result = dbGetR0Labels();
        break;
      case 'createR0Label':
        result = dbCreateR0Label(payload);
        break;
      case 'updateR0Label':
        result = dbUpdateR0Label(payload.id, payload.data);
        break;
      case 'syncR0Labels':
        result = dbSyncR0Labels(payload.labels);
        break;

      // WMS 倉儲管理
      case 'getWmsLocations':
        result = dbGetWmsLocations().filter(l => l.isActive !== 'FALSE' && l.isActive !== false);
        break;
      case 'createWmsLocation':
        result = dbCreateWmsLocation(payload);
        break;
      case 'updateWmsLocation':
        result = dbUpdateWmsLocation(payload.id, payload.data);
        break;
      case 'deleteWmsLocation':
        result = dbDeleteWmsLocation(payload.id);
        break;
      case 'initWmsLocations':
        result = dbInitWmsLocations();
        break;
      case 'resetMes':
        result = dbResetMes(payload || {});
        break;
      case 'getWmsInventory':
        result = dbGetWmsInventory();
        break;
      case 'getWmsLocationSummary':
        result = dbGetWmsLocationSummary();
        break;
      case 'getWmsMovements':
        result = dbGetWmsMovements();
        break;
      case 'wmsInbound':
        result = dbWmsInbound(payload);
        break;
      case 'wmsOutbound':
        result = dbWmsOutbound(payload);
        break;
      case 'wmsTransfer':
        result = dbWmsTransfer(payload);
        break;
      case 'getWmsStockTakes':
        result = dbGetWmsStockTakes();
        break;
      case 'createWmsStockTake':
        result = dbCreateWmsStockTake(payload);
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
      case 'clearCache':
        clearDataCache();
        result = { cleared: true };
        break;
      case 'debugSheet':
        result = dbDebugSheet(payload.tableName || 'WorkOrders');
        break;
      case 'cleanInvalidWorkOrders':
        result = dbCleanInvalidWorkOrders();
        break;

      // Audit Logs (ISO 27001:2022)
      case 'getAuditLogs':
        result = dbGetAuditLogs(payload.limit || 100);
        break;
      case 'createAuditLog':
        result = dbCreateAuditLog(payload);
        break;

      // 排程管理 (Scheduling)
      case 'getShifts':
        result = dbGetShifts();
        break;
      case 'getShiftsByDate':
        result = dbGetShiftsByDate(payload.date);
        break;
      case 'getShiftsByDateRange':
        result = dbGetShiftsByDateRange(payload.startDate, payload.endDate);
        break;
      case 'createShift':
        result = dbCreateShift(payload);
        break;
      case 'updateShift':
        result = dbUpdateShift(payload.id, payload.data);
        break;
      case 'deleteShift':
        result = dbDeleteShift(payload.id);
        break;
      case 'importShifts':
        result = dbImportShifts(payload.shifts);
        break;
      case 'getEquipmentSchedules':
        result = dbGetEquipmentSchedules();
        break;
      case 'getEquipmentSchedulesByDate':
        result = dbGetEquipmentSchedulesByDate(payload.date);
        break;
      case 'createEquipmentSchedule':
        result = dbCreateEquipmentSchedule(payload);
        break;
      case 'updateEquipmentSchedule':
        result = dbUpdateEquipmentSchedule(payload.id, payload.data);
        break;
      case 'deleteEquipmentSchedule':
        result = dbDeleteEquipmentSchedule(payload.id);
        break;
      case 'getSchedulePlans':
        result = dbGetSchedulePlans();
        break;
      case 'createSchedulePlan':
        result = dbCreateSchedulePlan(payload);
        break;
      case 'updateSchedulePlan':
        result = dbUpdateSchedulePlan(payload.id, payload.data);
        break;
      case 'getScheduleStats':
        result = dbGetScheduleStats(payload.date);
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