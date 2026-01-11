/**
 * Database.js - Google Sheets 資料庫操作層 (Standalone Version)
 * 負責處理資料表初始化與 CRUD
 */

const DB_CONFIG = {
  sheets: {
    workOrders: {
      name: 'WorkOrders',
      headers: [
        'id', 'orderNumber', 'orderType', 'customerName', 'customerSite', 'productModel',
        'quantity', 'completedQty', 'goodQty', 'ngQty', 'status',
        'priority', 'dueDate', 'targetRegenerationCount', 'sourceWorkOrderId', 'sourceOrderNumber',
        'reworkCount', 'createdAt', 'updatedAt', 'syncStatus'
      ]
    },
    dispatches: {
      name: 'Dispatches',
      headers: [
        'id', 'dispatchNumber', 'workOrderId', 'stationName', 'operatorName', 
        'quantity', 'completedQty', 'goodQty', 'ngQty', 'status', 
        'plannedStartAt', 'actualStartAt', 'createdAt', 'syncStatus'
      ]
    },
    reports: {
      name: 'Reports',
      headers: [
        'id', 'reportNumber', 'workOrderId', 'dispatchId', 'operatorName', 
        'stationName', 'quantity', 'goodQty', 'ngQty', 'startTime', 
        'endTime', 'hasAbnormal', 'abnormalType', 'createdAt', 'syncStatus'
      ]
    },
    epcHistory: {
      name: 'EpcHistory',
      headers: [
        'id', 'workOrderId', 'orderNumber', 'productModel', 'oldEpc', 'newEpc', 
        'changeType', 'stationName', 'operatorName', 'createdAt', 'syncStatus', 'notes'
      ]
    },
    operators: {
      name: 'Operators',
      headers: ['id', 'name', 'code', 'email', 'role', 'pin', 'isActive', 'createdAt']
    },
    customers: {
      name: 'Customers',
      headers: ['id', 'name', 'code', 'sites', 'isActive', 'createdAt']
    },
    products: {
      name: 'Products',
      headers: ['id', 'name', 'code', 'type', 'isActive', 'createdAt']
    },
    outgassingTests: {
      name: 'OutgassingTests',
      headers: [
        'id', 'testNumber', 'workOrderId', 'orderNumber', 'productModel',
        'batchNumber', 'batchSize', 'sampleIndex', 'rfidCode',
        'result', 'testValue', 'threshold', 'operatorName',
        'testedAt', 'notes', 'signature', 'createdAt', 'syncStatus'
      ]
    },
    aoiInspections: {
      name: 'AoiInspections',
      headers: [
        'id', 'inspectionNumber', 'workOrderId', 'orderNumber', 'productModel',
        'rfidCode', 'result', 'defectType', 'defectCount', 'imagePath',
        'operatorName', 'inspectedAt', 'importBatch', 'signature', 'createdAt', 'syncStatus'
      ]
    },
    r0Labels: {
      name: 'R0Labels',
      headers: [
        'id', 'r0Code', 'currentEpc', 'workOrderId', 'orderNumber', 'customerName',
        'customerCode', 'productModel', 'productCode', 'regenerationStatus', 'regenerationCount',
        'history', 'createdAt', 'updatedAt'
      ]
    },
    ngReasons: {
      name: 'NgReasons',
      headers: ['id', 'name', 'code', 'description', 'isActive', 'sortOrder', 'createdAt']
    },
    ngDetails: {
      name: 'NgDetails',
      headers: [
        'id', 'reportId', 'dispatchId', 'workOrderId', 'reasonId', 'reasonName',
        'quantity', 'barcodes', 'notes', 'createdAt'
      ]
    },
    // WMS 倉儲管理
    wmsLocations: {
      name: 'WmsLocations',
      headers: ['id', 'code', 'name', 'factory', 'locationType', 'capacity', 'isActive', 'sortOrder', 'createdAt']
    },
    wmsInventory: {
      name: 'WmsInventory',
      headers: [
        'id', 'locationCode', 'workOrderId', 'orderNumber', 'productModel', 'customerName',
        'quantity', 'barcode', 'status', 'inboundDate', 'createdAt', 'updatedAt'
      ]
    },
    wmsMovements: {
      name: 'WmsMovements',
      headers: [
        'id', 'movementNumber', 'fromLocation', 'toLocation', 'workOrderId', 'orderNumber',
        'productModel', 'quantity', 'barcode', 'movementType', 'operatorName', 'reason', 'createdAt'
      ]
    },
    wmsStockTakes: {
      name: 'WmsStockTakes',
      headers: [
        'id', 'stockTakeNumber', 'locationCode', 'locationName', 'operatorName',
        'totalItems', 'adjustedItems', 'status', 'notes', 'createdAt'
      ]
    },
    wmsStockTakeDetails: {
      name: 'WmsStockTakeDetails',
      headers: [
        'id', 'stockTakeId', 'inventoryId', 'barcode', 'orderNumber', 'productModel',
        'systemQty', 'actualQty', 'diffQty', 'notes', 'createdAt'
      ]
    },
    // 物料主檔
    parts: {
      name: 'Parts',
      headers: [
        'id', 'partNumber', 'name', 'spec', 'unit', 'category',
        'safetyStock', 'notes', 'isActive', 'createdAt', 'updatedAt'
      ]
    },
    // 操作紀錄 (ISO 27001:2022 A.8.15)
    auditLogs: {
      name: 'AuditLogs',
      headers: [
        'id', 'timestamp', 'operatorName', 'operatorCode', 'action', 'module',
        'targetType', 'targetId', 'targetName', 'details', 'ipAddress', 'userAgent'
      ]
    },
    // 排程管理
    shifts: {
      name: 'Shifts',
      headers: [
        'id', 'shiftDate', 'shiftType', 'operatorId', 'operatorName',
        'stationName', 'startTime', 'endTime', 'status', 'notes', 'createdAt'
      ]
    },
    equipmentSchedules: {
      name: 'EquipmentSchedules',
      headers: [
        'id', 'scheduleDate', 'equipmentType', 'equipmentId', 'equipmentName',
        'workOrderId', 'dispatchId', 'startTime', 'endTime', 'status', 'notes', 'createdAt'
      ]
    },
    schedulePlans: {
      name: 'SchedulePlans',
      headers: [
        'id', 'planName', 'planDate', 'planType', 'totalDispatches',
        'completedDispatches', 'status', 'createdBy', 'notes', 'createdAt'
      ]
    }
  }
};

/**
 * 效能優化：一次取得所有資料（含快取）
 * 快取時間：5 分鐘
 */
function getAllDataWithCache() {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'MES_ALL_DATA_V1';

  // 嘗試從快取讀取
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // 快取資料損壞，忽略並重新讀取
    }
  }

  // 從資料庫讀取所有資料
  const data = {
    workOrders: dbGetWorkOrders().filter(w => w.status !== 'cancelled'),
    dispatches: dbGetDispatches().filter(d => d.status !== 'cancelled'),
    reports: dbGetReports(),
    operators: dbGetOperators().filter(o => o.isActive !== 'FALSE' && o.isActive !== false),
    customers: dbGetCustomers().filter(c => c.isActive !== 'FALSE' && c.isActive !== false),
    products: dbGetProducts().filter(p => p.isActive !== 'FALSE' && p.isActive !== false),
    parts: dbGetParts().filter(p => p.isActive !== 'FALSE' && p.isActive !== false),
    ngReasons: dbGetNgReasons().filter(r => r.isActive !== 'FALSE' && r.isActive !== false),
    outgassingTests: dbGetOutgassingTests(),
    aoiInspections: dbGetAoiInspections(),
    epcHistory: dbGetEpcHistory(),
    r0Labels: dbGetR0Labels()
  };

  // 寫入快取（5 分鐘 = 300 秒）
  try {
    const jsonData = JSON.stringify(data);
    // GAS 快取限制 100KB，超過則不快取
    if (jsonData.length < 100000) {
      cache.put(cacheKey, jsonData, 300);
    }
  } catch (e) {
    console.warn('Cache write failed:', e);
  }

  return data;
}

/**
 * 清除快取（資料異動時呼叫）
 */
function clearDataCache() {
  const cache = CacheService.getScriptCache();
  cache.remove('MES_ALL_DATA_V1');
}

function dbGetOperators() { return getTableData('Operators'); }
function dbCreateOperator(data) {
  data.isActive = true;
  return insertRecord('Operators', data);
}
function dbUpdateOperator(id, data) {
  return updateRecord('Operators', id, data);
}
function dbDeleteOperator(id) {
  return deleteRecord('Operators', id);
}

function dbGetEpcLastRecord(epc) {
  // 搜尋 EPC 的最後一次紀錄 (從 EpcHistory 找)
  const history = getTableData('EpcHistory');
  // 找作為 "newEpc" 的紀錄 (表示它是那次產生的)
  const match = history.find(h => h.newEpc === epc);
  if (match) return match;
  
  // 未來擴充: 也可以搜尋 "WorkOrders" 或 "Reports" 關聯
  return null;
}

// Customers & Products
function dbGetCustomers() { return getTableData('Customers'); }
function dbCreateCustomer(data) {
  data.isActive = true;
  // sites 傳入時應該是陣列，轉為 JSON string 存入
  if (Array.isArray(data.sites)) data.sites = JSON.stringify(data.sites);
  return insertRecord('Customers', data);
}
function dbUpdateCustomer(id, data) {
  if (Array.isArray(data.sites)) data.sites = JSON.stringify(data.sites);
  return updateRecord('Customers', id, data);
}
function dbDeleteCustomer(id) { return updateRecord('Customers', id, { isActive: false }); }

function dbGetProducts() { return getTableData('Products'); }
function dbCreateProduct(data) {
  data.isActive = true;
  return insertRecord('Products', data);
}
function dbUpdateProduct(id, data) {
  return updateRecord('Products', id, data);
}
function dbDeleteProduct(id) { return updateRecord('Products', id, { isActive: false }); }

// Parts (物料主檔) CRUD
function dbGetParts() { return getTableData('Parts'); }
function dbCreatePart(data) {
  data.isActive = true;
  data.createdAt = new Date().toISOString();
  return insertRecord('Parts', data);
}
function dbUpdatePart(id, data) {
  data.updatedAt = new Date().toISOString();
  return updateRecord('Parts', id, data);
}
function dbDeletePart(id) { return updateRecord('Parts', id, { isActive: false }); }

// NG Reasons CRUD
function dbGetNgReasons() { return getTableData('NgReasons'); }
function dbCreateNgReason(data) {
  data.isActive = true;
  data.sortOrder = data.sortOrder || 0;
  return insertRecord('NgReasons', data);
}
function dbUpdateNgReason(id, data) {
  return updateRecord('NgReasons', id, data);
}
function dbDeleteNgReason(id) { return updateRecord('NgReasons', id, { isActive: false }); }

// NG Details CRUD
function dbGetNgDetails() { return getTableData('NgDetails'); }
function dbCreateNgDetail(data) {
  // barcodes 以 JSON 字串儲存
  if (Array.isArray(data.barcodes)) {
    data.barcodes = JSON.stringify(data.barcodes);
  }
  return insertRecord('NgDetails', data);
}
function dbGetNgDetailsByReport(reportId) {
  return dbGetNgDetails().filter(d => d.reportId === reportId);
}

/**
 * 取得或建立資料庫 Spreadsheet
 */
function getDbSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const fileId = props.getProperty('DB_SPREADSHEET_ID');
  let ss = null;

  if (fileId) {
    try {
      ss = SpreadsheetApp.openById(fileId);
    } catch (e) {
      console.warn('無法開啟原有試算表 (可能已刪除，或權限不足):', e);
      // 嘗試清除舊 ID，以便重新建立
      props.deleteProperty('DB_SPREADSHEET_ID');
    }
  }

  if (!ss) {
    console.log('建立新的資料庫試算表...');
    try {
      ss = SpreadsheetApp.create('SMAI_MES_線外資料庫');
      const newId = ss.getId();
      props.setProperty('DB_SPREADSHEET_ID', newId);
      console.log('新資料庫已建立，ID:', newId);
    } catch (e) {
      console.error('建立試算表失敗:', e);
      throw new Error('系統無法建立資料庫檔案，請檢查 Google Drive 權限。錯誤: ' + e.toString());
    }
  }
  
  if (!ss) throw new Error('嚴重錯誤: 無法取得資料庫實例');
  return ss;
}

/**
 * 初始化資料庫 (建立缺少的 Sheet + 同步欄位)
 */
function initDatabase() {
  const ss = getDbSpreadsheet();

  Object.keys(DB_CONFIG.sheets).forEach(key => {
    const config = DB_CONFIG.sheets[key];
    let sheet = ss.getSheetByName(config.name);

    if (!sheet) {
      // 建立新 Sheet
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, config.headers.length)
           .setFontWeight('bold')
           .setBackground('#E0E0E0');
    } else {
      // 同步欄位：檢查並新增缺少的欄位（加在最後面）
      const lastCol = sheet.getLastColumn();
      const existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      config.headers.forEach(header => {
        if (!existingHeaders.includes(header)) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue(header).setFontWeight('bold').setBackground('#E0E0E0');
          console.log(`Added column '${header}' to ${config.name}`);
        }
      });
    }
  });

  return { success: true, message: '資料庫初始化完成', url: ss.getUrl() };
}

/**
 * 清理無效工單資料（orderNumber 為空的資料）
 */
function dbCleanInvalidWorkOrders() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName('WorkOrders');
  if (!sheet) return { deleted: 0 };

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { deleted: 0 };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const orderNumberIdx = headers.indexOf('orderNumber');

  if (orderNumberIdx === -1) return { error: 'orderNumber column not found' };

  // 從最後一行往前刪除（避免行號錯亂）
  let deleted = 0;
  for (let i = lastRow; i >= 2; i--) {
    const orderNumber = data[i - 1][orderNumberIdx];
    if (!orderNumber || orderNumber === '') {
      sheet.deleteRow(i);
      deleted++;
    }
  }

  if (deleted > 0) clearDataCache();
  return { deleted: deleted };
}

/**
 * 除錯：檢查 Sheet 結構
 */
function dbDebugSheet(tableName) {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return { error: 'Sheet not found: ' + tableName };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { error: 'Empty sheet' };

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const config = Object.values(DB_CONFIG.sheets).find(s => s.name === tableName);
  const expectedHeaders = config ? config.headers : [];

  // 取得第一筆資料（如果有的話）
  let firstRow = null;
  let firstRowObj = null;
  if (lastRow >= 2) {
    firstRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
    firstRowObj = {};
    headers.forEach((h, i) => { firstRowObj[h] = firstRow[i]; });
  }

  return {
    sheetName: tableName,
    lastRow: lastRow,
    lastCol: lastCol,
    actualHeaders: headers,
    expectedHeaders: expectedHeaders,
    headersMatch: JSON.stringify(headers.slice(0, expectedHeaders.length)) === JSON.stringify(expectedHeaders),
    firstRowRaw: firstRow,
    firstRowObj: firstRowObj
  };
}

/**
 * 通用：取得 Sheet 資料轉 Object Array
 */
function getTableData(tableName) {
  const ss = getDbSpreadsheet();
  // 再次確保 ss 存在
  if (!ss) throw new Error('Database connection lost');

  const config = Object.values(DB_CONFIG.sheets).find(s => s.name === tableName);
  if (!config) throw new Error(`Table ${tableName} not found in config`);
  
  let sheet = ss.getSheetByName(tableName);
  
  // 自動修復: 如果找不到 Sheet，嘗試初始化
  if (!sheet) {
    console.warn(`Table ${tableName} missing, running init...`);
    initDatabase();
    sheet = ss.getSheetByName(tableName);
  }

  if (!sheet) return []; // 真的找不到，回傳空陣列
  
  if (sheet.getLastRow() < 2) return [];
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).reverse();
}

/**
 * 通用：新增資料
 */
function insertRecord(tableName, record) {
  const ss = getDbSpreadsheet();
  const config = Object.values(DB_CONFIG.sheets).find(s => s.name === tableName);
  if (!config) throw new Error(`Table ${tableName} not found`);

  let sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(tableName);
  }

  if (!record.id) record.id = Utilities.getUuid();
  if (!record.createdAt) record.createdAt = new Date().toISOString();
  record.syncStatus = 'pending';

  // 使用實際 Sheet 的欄位順序，而非 config 順序
  const lastCol = sheet.getLastColumn();
  const sheetHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : config.headers;

  const row = sheetHeaders.map(header => {
    return record[header] !== undefined ? record[header] : '';
  });

  sheet.appendRow(row);
  clearDataCache(); // 清除快取
  return record;
}

/**
 * 通用：更新資料 (By ID)
 */
function updateRecord(tableName, id, updates) {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return false;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      const rowIndex = i + 1;
      Object.keys(updates).forEach(key => {
        const colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(rowIndex, colIndex + 1).setValue(updates[key]);
        }
      });
      const updatedAtIndex = headers.indexOf('updatedAt');
      if (updatedAtIndex !== -1) {
        sheet.getRange(rowIndex, updatedAtIndex + 1).setValue(new Date().toISOString());
      }
      clearDataCache(); // 清除快取
      return true;
    }
  }
  return false;
}

// Hard delete - 真正刪除資料列
function deleteRecord(tableName, id) {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName(tableName);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === id) {
      sheet.deleteRow(i + 1);
      clearDataCache(); // 清除快取
      return true;
    }
  }
  return false;
}

// ========== 特定業務邏輯 ==========

function dbGetWorkOrders() { return getTableData('WorkOrders'); }
function dbCreateWorkOrder(data) {
  if (!data.orderNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.orderNumber = `WO-${dateStr}-${random}`;
  }

  // 重工工單邏輯：檢查來源工單的重工次數
  if (data.orderType === 'rework' && data.sourceWorkOrderId) {
    const workOrders = dbGetWorkOrders();
    const sourceWo = workOrders.find(w => w.id === data.sourceWorkOrderId);
    if (sourceWo) {
      const sourceReworkCount = parseInt(sourceWo.reworkCount) || 0;
      // 重工上限 = 1 次，超過則應報廢
      if (sourceReworkCount >= 1) {
        throw new Error('此工單已重工過，重工後仍 NG 應報廢處理');
      }
      // 設定新工單的重工次數 = 來源工單重工次數 + 1
      data.reworkCount = sourceReworkCount + 1;
    }
  } else {
    data.reworkCount = data.reworkCount || 0;
  }

  data.completedQty = 0; data.goodQty = 0; data.ngQty = 0;
  data.status = data.status || 'draft';
  return insertRecord('WorkOrders', data);
}
function dbUpdateWorkOrder(id, data) {
  return updateRecord('WorkOrders', id, data);
}
function dbDeleteWorkOrder(id) {
  // 軟刪除：標記為 cancelled
  return updateRecord('WorkOrders', id, { status: 'cancelled' });
}
function dbGetDispatches() { return getTableData('Dispatches'); }
function dbCreateDispatch(data) {
  if (!data.dispatchNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.dispatchNumber = `DS-${dateStr}-${random}`;
  }
  // 設定派工初始狀態
  data.status = 'pending';
  data.completedQty = 0;
  data.goodQty = 0;
  data.ngQty = 0;

  const workOrders = dbGetWorkOrders();
  const wo = workOrders.find(w => w.id === data.workOrderId);
  // 檢查 draft 或 pending 狀態的工單，派工後改為進行中
  if (wo && (wo.status === 'draft' || wo.status === 'pending')) {
    updateRecord('WorkOrders', data.workOrderId, { status: 'in_progress' });
  }
  return insertRecord('Dispatches', data);
}

function dbUpdateDispatch(id, data) {
  return updateRecord('Dispatches', id, data);
}
function dbDeleteDispatch(id) {
  // 軟刪除：標記為 cancelled
  return updateRecord('Dispatches', id, { status: 'cancelled' });
}
function dbStartDispatch(id) {
  return updateRecord('Dispatches', id, {
    status: 'in_progress',
    actualStartAt: new Date().toISOString()
  });
}

function dbCompleteDispatch(id) {
  // 注意：這裡只標記時間，真正的狀態完成 (completed) 通常由報工數量決定
  // 但如果使用者強制點擊「完成」，我們也可以先標記
  return updateRecord('Dispatches', id, {
    // status: 'completed', // 暫不強制改狀態，由報工邏輯決定，或者讓前端決定
    actualEndAt: new Date().toISOString()
  });
}

function dbGetReports() { return getTableData('Reports'); }
function dbCreateReport(data) {
  if (!data.reportNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.reportNumber = `RP-${dateStr}-${random}`;
  }
  const report = insertRecord('Reports', data);
  const dispatches = dbGetDispatches();
  const dispatch = dispatches.find(d => d.id === data.dispatchId);
  if (dispatch) {
    const newGood = Number(dispatch.goodQty || 0) + Number(data.goodQty || 0);
    const newNg = Number(dispatch.ngQty || 0) + Number(data.ngQty || 0);
    const newCompleted = newGood + newNg;
    const updates = { goodQty: newGood, ngQty: newNg, completedQty: newCompleted };
    if (newCompleted >= dispatch.quantity) updates.status = 'completed';
    else updates.status = 'in_progress';
    updateRecord('Dispatches', data.dispatchId, updates);

    // 更新工單數量
    const workOrders = dbGetWorkOrders();
    const wo = workOrders.find(w => w.id === dispatch.workOrderId);
    if (wo) {
      const woNewGood = Number(wo.goodQty || 0) + Number(data.goodQty || 0);
      const woNewNg = Number(wo.ngQty || 0) + Number(data.ngQty || 0);
      const woNewCompleted = Number(wo.completedQty || 0) + Number(data.goodQty || 0) + Number(data.ngQty || 0);
      const woUpdates = { goodQty: woNewGood, ngQty: woNewNg, completedQty: woNewCompleted };
      // 工單完成判定：完成數量 >= 目標數量
      if (woNewCompleted >= Number(wo.quantity || 0)) {
        woUpdates.status = 'completed';
      }
      updateRecord('WorkOrders', wo.id, woUpdates);
    }
  }
  return report;
}

function dbGetEpcHistory() { return getTableData('EpcHistory'); }

function dbCreateEpcHistory(data) {
  // data: { workOrderId, oldEpc, newEpc, operatorName, notes ... }
  
  // 自動補全相關資訊
  const workOrders = dbGetWorkOrders();
  const wo = workOrders.find(w => w.id === data.workOrderId);
  
  if (wo) {
    data.orderNumber = wo.orderNumber;
    data.productModel = wo.productModel;
  }
  
  data.stationName = 'RFID更換'; // 固定站點
  data.changeType = '再生換碼';   // 固定類型

  return insertRecord('EpcHistory', data);
}

// ========== 釋氣檢驗 ==========

function dbGetOutgassingTests() { return getTableData('OutgassingTests'); }

function dbCreateOutgassingTest(data) {
  if (!data.testNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.testNumber = `OG-${dateStr}-${random}`;
  }

  // 自動補全工單資訊
  if (data.workOrderId) {
    const workOrders = dbGetWorkOrders();
    const wo = workOrders.find(w => w.id === data.workOrderId);
    if (wo) {
      data.orderNumber = wo.orderNumber;
      data.productModel = wo.productModel;
    }
  }

  data.testedAt = data.testedAt || new Date().toISOString();
  return insertRecord('OutgassingTests', data);
}

// 計算批次抽樣資訊 (18抽1)
function dbGetOutgassingSampleInfo(workOrderId) {
  const tests = dbGetOutgassingTests().filter(t => t.workOrderId === workOrderId);
  const workOrders = dbGetWorkOrders();
  const wo = workOrders.find(w => w.id === workOrderId);

  if (!wo) return { error: '找不到工單' };

  const totalQty = Number(wo.quantity || 0);
  const completedQty = Number(wo.completedQty || 0);
  const sampleRate = 18; // 每 18 片抽 1 片
  const requiredSamples = Math.ceil(totalQty / sampleRate);
  const testedCount = tests.length;
  const passCount = tests.filter(t => t.result === 'PASS').length;
  const failCount = tests.filter(t => t.result === 'NG').length;

  // 下一個應該抽樣的編號 (1-based)
  const nextSampleIndex = testedCount + 1;
  // 下一個抽樣對應的批次起始編號
  const nextBatchStart = (testedCount * sampleRate) + 1;
  const nextBatchEnd = Math.min((testedCount + 1) * sampleRate, totalQty);

  return {
    workOrderId,
    orderNumber: wo.orderNumber,
    totalQty,
    completedQty,
    sampleRate,
    requiredSamples,
    testedCount,
    passCount,
    failCount,
    passRate: testedCount > 0 ? Math.round(passCount / testedCount * 100) : 0,
    nextSampleIndex,
    nextBatchRange: `${nextBatchStart}-${nextBatchEnd}`,
    isComplete: testedCount >= requiredSamples
  };
}

// ========== AOI 檢驗 ==========

function dbGetAoiInspections() { return getTableData('AoiInspections'); }

function dbCreateAoiInspection(data) {
  if (!data.inspectionNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.inspectionNumber = `AOI-${dateStr}-${random}`;
  }

  // 自動補全工單資訊
  if (data.workOrderId) {
    const workOrders = dbGetWorkOrders();
    const wo = workOrders.find(w => w.id === data.workOrderId);
    if (wo) {
      data.orderNumber = wo.orderNumber;
      data.productModel = wo.productModel;
    }
  }

  data.inspectedAt = data.inspectedAt || new Date().toISOString();
  return insertRecord('AoiInspections', data);
}

// 批次匯入 AOI CSV 資料
// AOI CSV 格式: 日期,MeasureID,工單號碼,序號,配方,方向,Position_X,Position_Y,Width,Height,辨識結果,儲存路徑,User
// 注意: AOI 軟體輸出的 CSV 格式異常，所有資料可能被包在第一欄的引號內
function dbImportAoiCsv(workOrderId, csvRows, operatorName) {
  const importBatch = Utilities.getUuid();
  const results = [];

  // 解析並彙整缺陷資料 (按序號分組)
  const defectsBySerial = {};

  csvRows.forEach((row, index) => {
    let parsedRow = row;

    // 處理 AOI CSV 異常格式: 所有資料被包在第一欄
    if (row['日期'] && row['日期'].includes(',')) {
      const parts = row['日期'].split(', ');
      if (parts.length >= 11) {
        parsedRow = {
          date: parts[0],
          measureId: parts[1],
          orderNumber: parts[2],
          serialNumber: parts[3],
          recipe: parts[4],
          direction: parts[5],
          posX: parts[6],
          posY: parts[7],
          width: parts[8],
          height: parts[9],
          result: parts[10],
          path: parts[11] || '',
          user: parts[12] || ''
        };
      }
    }

    // 取得序號 (RFID)
    const serial = parsedRow.serialNumber || parsedRow['序號'] || parsedRow.rfidCode || parsedRow.RFID || '';
    if (!serial) return;

    // 取得檢測結果
    const result = (parsedRow.result || parsedRow['辨識結果'] || '').toLowerCase();
    const isDefect = result === 'damage' || result === 'ng' || result === 'fail';

    // 彙整缺陷
    if (!defectsBySerial[serial]) {
      defectsBySerial[serial] = {
        serial,
        defectCount: 0,
        defectTypes: [],
        positions: []
      };
    }

    if (isDefect) {
      defectsBySerial[serial].defectCount++;
      defectsBySerial[serial].positions.push({
        x: parsedRow.posX || parsedRow['Position_X'],
        y: parsedRow.posY || parsedRow['Position_Y']
      });
    }
  });

  // 為每個序號建立 AOI 檢驗紀錄
  Object.values(defectsBySerial).forEach((item, index) => {
    const data = {
      workOrderId,
      rfidCode: item.serial,
      result: item.defectCount > 0 ? 'NG' : 'PASS',
      defectType: item.defectCount > 0 ? 'damage' : '',
      defectCount: item.defectCount,
      operatorName,
      importBatch
    };

    try {
      const record = dbCreateAoiInspection(data);
      results.push({ row: index + 1, serial: item.serial, success: true, id: record.id, defectCount: item.defectCount });
    } catch (e) {
      results.push({ row: index + 1, serial: item.serial, success: false, error: e.toString() });
    }
  });

  return {
    importBatch,
    totalRows: csvRows.length,
    uniqueSerials: Object.keys(defectsBySerial).length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    details: results
  };
}

// ========== 資料修復 ==========

// 修復舊的「清洗站」紀錄為「除膠站」
function dbFixStationName() {
  const ss = getDbSpreadsheet();
  const sheet = ss.getSheetByName('Dispatches');
  if (!sheet) return { fixed: 0 };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const stationIdx = headers.indexOf('stationName');

  let fixed = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][stationIdx] === '清洗站') {
      sheet.getRange(i + 1, stationIdx + 1).setValue('除膠站');
      fixed++;
    }
  }

  return { updated: fixed, message: `已修正 ${fixed} 筆紀錄` };
}

// ========== 測試資料產生 ==========

function dbGenerateTestData() {
  const results = { customers: 0, products: 0, operators: 0, workOrders: 0, dispatches: 0, reports: 0, outgassingTests: 0, aoiInspections: 0 };

  // 1. 建立測試客戶
  const testCustomers = [
    { name: '台積電', code: 'TSMC', sites: JSON.stringify(['F12', 'F18P5', 'F18P7']) },
    { name: '聯電', code: 'UMC', sites: JSON.stringify(['8A', '8S']) }
  ];
  testCustomers.forEach(c => {
    try { insertRecord('Customers', { ...c, isActive: true }); results.customers++; } catch(e) {}
  });

  // 2. 建立測試產品
  const testProducts = [
    { name: 'HEPA 濾網 10cm', code: 'HEPA-10', type: '10cm' },
    { name: 'ULPA 濾網 20cm', code: 'ULPA-20', type: '20cm' }
  ];
  testProducts.forEach(p => {
    try { insertRecord('Products', { ...p, isActive: true }); results.products++; } catch(e) {}
  });

  // 3. 建立測試人員
  const testOperators = [
    { name: '王大明', code: 'OP001', role: 'operator' },
    { name: '李小華', code: 'OP002', role: 'operator' },
    { name: '張品管', code: 'QC001', role: 'qc' }
  ];
  testOperators.forEach(o => {
    try { insertRecord('Operators', { ...o, isActive: true }); results.operators++; } catch(e) {}
  });

  // 4. 建立測試工單
  const wo1 = dbCreateWorkOrder({
    customerName: '台積電',
    customerSite: 'F12',
    productModel: 'HEPA-10',
    quantity: 36,
    orderType: 'deglue',
    priority: 'normal'
  });
  results.workOrders++;

  const wo2 = dbCreateWorkOrder({
    customerName: '聯電',
    customerSite: '8A',
    productModel: 'ULPA-20',
    quantity: 18,
    orderType: 'deglue',
    priority: 'urgent'
  });
  results.workOrders++;

  // 5. 建立測試派工
  const ds1 = dbCreateDispatch({
    workOrderId: wo1.id,
    stationName: '除膠站',
    operatorName: '王大明',
    quantity: 18
  });
  results.dispatches++;

  const ds2 = dbCreateDispatch({
    workOrderId: wo1.id,
    stationName: '除膠站',
    operatorName: '李小華',
    quantity: 18
  });
  results.dispatches++;

  // 6. 模擬報工
  dbStartDispatch(ds1.id);
  dbCreateReport({
    dispatchId: ds1.id,
    workOrderId: wo1.id,
    operatorName: '王大明',
    stationName: '除膠站',
    goodQty: 16,
    ngQty: 2,
    hasAbnormal: false
  });
  results.reports++;

  // 7. 建立釋氣檢驗測試資料
  dbCreateOutgassingTest({
    workOrderId: wo1.id,
    rfidCode: 'BC-TEST-001',
    result: 'PASS',
    operatorName: '張品管'
  });
  results.outgassingTests++;

  dbCreateOutgassingTest({
    workOrderId: wo1.id,
    rfidCode: 'BC-TEST-002',
    result: 'NG',
    notes: '釋氣值超標',
    operatorName: '張品管'
  });
  results.outgassingTests++;

  // 8. 建立 AOI 檢驗測試資料
  dbCreateAoiInspection({
    workOrderId: wo1.id,
    rfidCode: 'BC-TEST-003',
    result: 'PASS',
    operatorName: '張品管'
  });
  results.aoiInspections++;

  dbCreateAoiInspection({
    workOrderId: wo1.id,
    rfidCode: 'BC-TEST-004',
    result: 'NG',
    defectType: '刮傷',
    defectCount: 1,
    operatorName: '張品管'
  });
  results.aoiInspections++;

  return results;
}

/**
 * 修復欄位順序問題
 * 當 Sheet 欄位順序與 config 不同時，重建整個資料表
 */
function dbFixColumnOrder() {
  const ss = getDbSpreadsheet();
  const results = { fixed: [] };

  Object.keys(DB_CONFIG.sheets).forEach(key => {
    const config = DB_CONFIG.sheets[key];
    const sheet = ss.getSheetByName(config.name);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 1 || lastCol < 1) return;

    const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const expectedHeaders = config.headers;

    // 檢查欄位順序是否一致
    const needsFix = expectedHeaders.some((h, i) => currentHeaders[i] !== h);
    if (!needsFix) return;

    console.log(`Fixing ${config.name}: current=${currentHeaders.join(',')}, expected=${expectedHeaders.join(',')}`);

    // 讀取所有資料 (用當前的欄位名稱對應)
    const allData = sheet.getDataRange().getValues();
    const rows = allData.slice(1); // 跳過 header

    // 建立欄位對應 map
    const colMap = {};
    currentHeaders.forEach((h, i) => { colMap[h] = i; });

    // 重建資料
    const newData = [expectedHeaders]; // 新的 header 行
    rows.forEach(row => {
      const newRow = expectedHeaders.map(h => {
        const idx = colMap[h];
        return idx !== undefined ? row[idx] : '';
      });
      newData.push(newRow);
    });

    // 清除舊資料並寫入新資料
    sheet.clear();
    sheet.getRange(1, 1, newData.length, expectedHeaders.length).setValues(newData);
    sheet.getRange(1, 1, 1, expectedHeaders.length).setFontWeight('bold').setBackground('#E0E0E0');

    results.fixed.push(config.name);
  });

  // 清除後端快取，確保下次讀取會拿到新資料
  if (results.fixed.length > 0) {
    clearDataCache();
  }

  return results;
}

/**
 * 修復簽名資料位置問題 (針對 OutgassingTests 和 AoiInspections)
 * 問題：舊 insertRecord 把簽名存到 createdAt 欄位位置
 */
function dbFixSignatureData() {
  const ss = getDbSpreadsheet();
  const results = { fixed: 0, tables: [] };
  const tablesToFix = ['OutgassingTests', 'AoiInspections'];

  tablesToFix.forEach(tableName => {
    const sheet = ss.getSheetByName(tableName);
    if (!sheet) return;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const signatureIdx = headers.indexOf('signature');
    const createdAtIdx = headers.indexOf('createdAt');
    const syncStatusIdx = headers.indexOf('syncStatus');

    if (signatureIdx === -1 || createdAtIdx === -1) return;

    // 讀取所有資料
    const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    let fixedCount = 0;

    data.forEach((row, rowIdx) => {
      const createdAtVal = row[createdAtIdx];
      const signatureVal = row[signatureIdx];
      const syncStatusVal = syncStatusIdx !== -1 ? row[syncStatusIdx] : '';

      // 檢測：如果 createdAt 欄位包含 base64 圖片，表示資料位置錯誤
      if (typeof createdAtVal === 'string' && createdAtVal.startsWith('data:image/')) {
        // 修正資料位置
        row[signatureIdx] = createdAtVal;  // 把圖片移到 signature
        row[createdAtIdx] = syncStatusVal; // syncStatus 的值是原本的 createdAt
        if (syncStatusIdx !== -1) {
          row[syncStatusIdx] = 'pending';    // 重設 syncStatus
        }
        fixedCount++;
      }
    });

    if (fixedCount > 0) {
      // 寫回修正後的資料
      sheet.getRange(2, 1, data.length, lastCol).setValues(data);
      results.fixed += fixedCount;
      results.tables.push(`${tableName}(${fixedCount}筆)`);
    }
  });

  return results;
}

// ========== R0 標籤 (跨裝置同步) ==========

function dbGetR0Labels() {
  const labels = getTableData('R0Labels');
  // 解析 history JSON 字串
  return labels.map(l => {
    if (l.history && typeof l.history === 'string') {
      try { l.history = JSON.parse(l.history); } catch(e) { l.history = []; }
    }
    return l;
  });
}

function dbCreateR0Label(data) {
  data.createdAt = data.createdAt || new Date().toISOString();
  data.updatedAt = new Date().toISOString();
  if (data.history && typeof data.history === 'object') {
    data.history = JSON.stringify(data.history);
  }
  return insertRecord('R0Labels', data);
}

function dbUpdateR0Label(id, data) {
  data.updatedAt = new Date().toISOString();
  if (data.history && typeof data.history === 'object') {
    data.history = JSON.stringify(data.history);
  }
  return updateRecord('R0Labels', id, data);
}

function dbDeleteR0Label(id) {
  return deleteRecord('R0Labels', id);
}

// 批次同步 R0 標籤
function dbSyncR0Labels(labels) {
  const existingLabels = dbGetR0Labels();
  const existingMap = {};
  existingLabels.forEach(l => { existingMap[l.r0Code] = l; });

  let created = 0, updated = 0;

  labels.forEach(label => {
    const existing = existingMap[label.r0Code];
    if (existing) {
      dbUpdateR0Label(existing.id, label);
      updated++;
    } else {
      dbCreateR0Label(label);
      created++;
    }
  });

  CacheService.getScriptCache().remove('MES_ALL_DATA_V1');
  return { created, updated, total: labels.length };
}

// ========== WMS 倉儲管理 ==========

// 倉區位置
function dbGetWmsLocations() { return getTableData('WmsLocations'); }

function dbCreateWmsLocation(data) {
  data.isActive = true;
  data.sortOrder = data.sortOrder || 0;
  return insertRecord('WmsLocations', data);
}

function dbUpdateWmsLocation(id, data) {
  return updateRecord('WmsLocations', id, data);
}

function dbDeleteWmsLocation(id) {
  return updateRecord('WmsLocations', id, { isActive: false });
}

// 初始化預設倉區 (柳工再生廠)
function dbInitWmsLocations() {
  // 檢查「活躍的」倉區，而非所有資料（包含軟刪除的）
  const existing = dbGetWmsLocations().filter(l => l.isActive !== 'FALSE' && l.isActive !== false);
  if (existing.length > 0) return { message: '倉區已存在', count: existing.length };

  const defaultLocations = [
    { code: 'Y3-3RA', name: '客戶來料暫存區', factory: '柳工再生廠', locationType: 'inbound', sortOrder: 1 },
    { code: 'Y3-3RB', name: '待再生倉', factory: '柳工再生廠', locationType: 'storage', sortOrder: 2 },
    { code: 'Y3-3RC', name: '進料前的安裝區', factory: '柳工再生廠', locationType: 'staging', sortOrder: 3 },
    { code: 'Y3-1RD', name: '成品堆棧區', factory: '柳工再生廠', locationType: 'outbound', sortOrder: 4 },
    { code: 'Y3-1RE', name: '成品倉', factory: '柳工再生廠', locationType: 'outbound', sortOrder: 5 },
    { code: 'Y3-3RF', name: '退運區', factory: '柳工再生廠', locationType: 'special', sortOrder: 6 },
    { code: 'Y3-6RG', name: '待驗區', factory: '柳工再生廠', locationType: 'qc', sortOrder: 7 },
    { code: 'Y3-2RH', name: '重工區', factory: '柳工再生廠', locationType: 'special', sortOrder: 8 },
    { code: 'Y3-8RI', name: '待除帳的報廢區', factory: '柳工再生廠', locationType: 'special', sortOrder: 9 }
  ];

  defaultLocations.forEach(loc => dbCreateWmsLocation(loc));
  return { message: '倉區初始化完成', count: defaultLocations.length };
}

// 重置 MES（清空所有業務資料並恢復預設）
// 保留：Operators, Customers, Products, NgReasons（基礎設定）
function dbResetMes(options = {}) {
  const ss = getDbSpreadsheet();
  const deleted = {};

  // 業務資料表（會被清空）
  const businessTables = [
    'WorkOrders', 'Dispatches', 'Reports', 'EpcHistory',
    'OutgassingTests', 'AoiInspections', 'R0Labels', 'NgDetails',
    'WmsLocations', 'WmsInventory', 'WmsMovements', 'WmsStockTakes',
    'Shifts', 'EquipmentSchedules', 'SchedulePlans'
  ];

  // 審計紀錄預設保留，除非明確要求刪除
  if (options.clearAuditLogs) {
    businessTables.push('AuditLogs');
  }

  businessTables.forEach(tableName => {
    const sheet = ss.getSheetByName(tableName);
    if (sheet && sheet.getLastRow() > 1) {
      const count = sheet.getLastRow() - 1;
      sheet.deleteRows(2, count);
      deleted[tableName] = count;
    } else {
      deleted[tableName] = 0;
    }
  });

  clearDataCache();

  // 重新初始化預設倉區
  const defaultLocations = [
    { code: 'Y3-3RA', name: '客戶來料暫存區', factory: '柳工再生廠', locationType: 'inbound', sortOrder: 1 },
    { code: 'Y3-3RB', name: '待再生倉', factory: '柳工再生廠', locationType: 'storage', sortOrder: 2 },
    { code: 'Y3-3RC', name: '進料前的安裝區', factory: '柳工再生廠', locationType: 'staging', sortOrder: 3 },
    { code: 'Y3-1RD', name: '成品堆棧區', factory: '柳工再生廠', locationType: 'outbound', sortOrder: 4 },
    { code: 'Y3-1RE', name: '成品倉', factory: '柳工再生廠', locationType: 'outbound', sortOrder: 5 },
    { code: 'Y3-3RF', name: '退運區', factory: '柳工再生廠', locationType: 'special', sortOrder: 6 },
    { code: 'Y3-6RG', name: '待驗區', factory: '柳工再生廠', locationType: 'qc', sortOrder: 7 },
    { code: 'Y3-2RH', name: '重工區', factory: '柳工再生廠', locationType: 'special', sortOrder: 8 },
    { code: 'Y3-8RI', name: '待除帳的報廢區', factory: '柳工再生廠', locationType: 'special', sortOrder: 9 }
  ];

  defaultLocations.forEach(loc => dbCreateWmsLocation(loc));

  // 計算總刪除筆數
  const totalDeleted = Object.values(deleted).reduce((sum, n) => sum + n, 0);

  return {
    message: 'MES 系統已重置',
    totalDeleted: totalDeleted,
    deleted: deleted,
    preserved: ['Operators', 'Customers', 'Products', 'NgReasons', options.clearAuditLogs ? null : 'AuditLogs'].filter(Boolean),
    wmsInitialized: defaultLocations.length
  };
}

// 庫存
function dbGetWmsInventory() { return getTableData('WmsInventory'); }

function dbCreateWmsInventory(data) {
  data.status = data.status || 'in_stock';
  data.inboundDate = data.inboundDate || new Date().toISOString();

  // 自動補全工單資訊
  if (data.workOrderId) {
    const workOrders = dbGetWorkOrders();
    const wo = workOrders.find(w => w.id === data.workOrderId);
    if (wo) {
      data.orderNumber = wo.orderNumber;
      data.productModel = wo.productModel;
      data.customerName = wo.customerName;
    }
  }

  return insertRecord('WmsInventory', data);
}

function dbUpdateWmsInventory(id, data) {
  data.updatedAt = new Date().toISOString();
  return updateRecord('WmsInventory', id, data);
}

function dbDeleteWmsInventory(id) {
  return deleteRecord('WmsInventory', id);
}

// 取得各倉區庫存統計
function dbGetWmsLocationSummary() {
  const locations = dbGetWmsLocations().filter(l => l.isActive !== 'FALSE' && l.isActive !== false);
  const inventory = dbGetWmsInventory();

  return locations.map(loc => {
    const items = inventory.filter(inv => inv.locationCode === loc.code);
    const totalQty = items.reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
    return {
      ...loc,
      itemCount: items.length,
      totalQty: totalQty
    };
  }).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

// 移動紀錄
function dbGetWmsMovements() { return getTableData('WmsMovements'); }

function dbCreateWmsMovement(data) {
  if (!data.movementNumber) {
    const dateStr = Utilities.formatDate(new Date(), 'GMT+8', 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    data.movementNumber = `MV-${dateStr}-${random}`;
  }

  // 自動補全工單資訊
  if (data.workOrderId) {
    const workOrders = dbGetWorkOrders();
    const wo = workOrders.find(w => w.id === data.workOrderId);
    if (wo) {
      data.orderNumber = wo.orderNumber;
      data.productModel = wo.productModel;
    }
  }

  return insertRecord('WmsMovements', data);
}

// 入庫作業
function dbWmsInbound(data) {
  // data: { locationCode, workOrderId, partId, quantity, barcode, operatorName }

  // 取得物料資訊（如果有 partId）
  let productModel = '';
  if (data.partId) {
    const part = dbGetParts().find(p => p.id === data.partId);
    if (part) {
      productModel = `[${part.partNumber}] ${part.name}`;
    }
  }

  // 建立庫存紀錄
  const inventory = dbCreateWmsInventory({
    locationCode: data.locationCode,
    workOrderId: data.workOrderId,
    productModel: productModel,
    quantity: data.quantity || 1,
    barcode: data.barcode
  });

  // 建立移動紀錄
  dbCreateWmsMovement({
    fromLocation: 'EXTERNAL',
    toLocation: data.locationCode,
    workOrderId: data.workOrderId,
    productModel: productModel,
    quantity: data.quantity || 1,
    barcode: data.barcode,
    movementType: 'inbound',
    operatorName: data.operatorName,
    reason: data.reason || '入庫'
  });

  return inventory;
}

// 出庫作業
function dbWmsOutbound(data) {
  // data: { inventoryId, operatorName, reason }
  const inventory = dbGetWmsInventory().find(inv => inv.id === data.inventoryId);
  if (!inventory) throw new Error('找不到庫存紀錄');

  // 建立移動紀錄
  dbCreateWmsMovement({
    fromLocation: inventory.locationCode,
    toLocation: 'EXTERNAL',
    workOrderId: inventory.workOrderId,
    quantity: inventory.quantity,
    barcode: inventory.barcode,
    movementType: 'outbound',
    operatorName: data.operatorName,
    reason: data.reason || '出庫'
  });

  // 刪除庫存紀錄
  dbDeleteWmsInventory(data.inventoryId);
  return { success: true };
}

// 移轉作業
function dbWmsTransfer(data) {
  // data: { inventoryId, toLocation, operatorName, reason }
  const inventory = dbGetWmsInventory().find(inv => inv.id === data.inventoryId);
  if (!inventory) throw new Error('找不到庫存紀錄');

  const fromLocation = inventory.locationCode;

  // 建立移動紀錄
  dbCreateWmsMovement({
    fromLocation: fromLocation,
    toLocation: data.toLocation,
    workOrderId: inventory.workOrderId,
    quantity: inventory.quantity,
    barcode: inventory.barcode,
    movementType: 'transfer',
    operatorName: data.operatorName,
    reason: data.reason || '移轉'
  });

  // 更新庫存位置
  dbUpdateWmsInventory(data.inventoryId, { locationCode: data.toLocation });
  return { success: true, fromLocation, toLocation: data.toLocation };
}

// === 盤點功能 ===
function dbGetWmsStockTakes() { return getTableData('WmsStockTakes'); }

function dbCreateWmsStockTake(data) {
  // data: { locationCode, locationName, operatorName, details: [{ inventoryId, actualQty }], notes }
  const stockTakeNumber = 'ST' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMddHHmmss');

  const details = data.details || [];
  let adjustedItems = 0;

  // 處理每個盤點項目
  details.forEach(item => {
    const inventory = dbGetWmsInventory().find(inv => inv.id === item.inventoryId);
    if (!inventory) return;

    const systemQty = Number(inventory.quantity) || 0;
    const actualQty = Number(item.actualQty) || 0;
    const diffQty = actualQty - systemQty;

    // 記錄盤點明細
    insertRecord('WmsStockTakeDetails', {
      stockTakeId: stockTakeNumber,
      inventoryId: item.inventoryId,
      barcode: inventory.barcode || '',
      orderNumber: inventory.orderNumber || '',
      productModel: inventory.productModel || '',
      systemQty: systemQty,
      actualQty: actualQty,
      diffQty: diffQty,
      notes: item.notes || ''
    });

    // 如有差異，更新庫存數量並記錄異動
    if (diffQty !== 0) {
      adjustedItems++;

      // 更新庫存數量
      dbUpdateWmsInventory(item.inventoryId, { quantity: actualQty });

      // 記錄調整移動
      dbCreateWmsMovement({
        fromLocation: data.locationCode,
        toLocation: data.locationCode,
        workOrderId: inventory.workOrderId,
        quantity: diffQty,
        barcode: inventory.barcode,
        movementType: 'adjustment',
        operatorName: data.operatorName,
        reason: '盤點調整: ' + (diffQty > 0 ? '+' : '') + diffQty
      });
    }
  });

  // 建立盤點主記錄
  const stockTake = insertRecord('WmsStockTakes', {
    stockTakeNumber: stockTakeNumber,
    locationCode: data.locationCode,
    locationName: data.locationName || '',
    operatorName: data.operatorName,
    totalItems: details.length,
    adjustedItems: adjustedItems,
    status: 'completed',
    notes: data.notes || ''
  });

  return { ...stockTake, adjustedItems };
}

function dbGetWmsStockTakeDetails(stockTakeId) {
  return getTableData('WmsStockTakeDetails').filter(d => d.stockTakeId === stockTakeId);
}


// ==================== Audit Logs (ISO 27001:2022 A.8.15) ====================

/**
 * 建立操作紀錄
 * @param {Object} data - 操作資料
 * @param {string} data.operatorName - 操作人姓名
 * @param {string} data.operatorCode - 操作人代號
 * @param {string} data.action - 動作 (create/update/delete/dispatch/complete/cancel)
 * @param {string} data.module - 模組 (workOrder/dispatch/report/wms)
 * @param {string} data.targetType - 目標類型 (WorkOrder/Dispatch/Report/WmsInventory)
 * @param {string} data.targetId - 目標 ID
 * @param {string} data.targetName - 目標名稱（如工單號）
 * @param {Object} data.details - 變更詳情
 */
function dbCreateAuditLog(data) {
  return insertRecord('AuditLogs', {
    timestamp: new Date().toISOString(),
    operatorName: data.operatorName || '系統',
    operatorCode: data.operatorCode || '',
    action: data.action || 'unknown',
    module: data.module || 'unknown',
    targetType: data.targetType || '',
    targetId: data.targetId || '',
    targetName: data.targetName || '',
    details: typeof data.details === 'object' ? JSON.stringify(data.details) : (data.details || ''),
    ipAddress: data.ipAddress || '',
    userAgent: data.userAgent || 'GAS Web App'
  });
}

/**
 * 取得操作紀錄（最近 100 筆）
 */
function dbGetAuditLogs(limit = 100) {
  const logs = getTableData('AuditLogs');
  // 依時間倒序排列
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return logs.slice(0, limit);
}

/**
 * 查詢特定目標的操作紀錄
 */
function dbGetAuditLogsByTarget(targetType, targetId) {
  return getTableData('AuditLogs')
    .filter(log => log.targetType === targetType && log.targetId === targetId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * 查詢特定操作人的操作紀錄
 */
function dbGetAuditLogsByOperator(operatorName, limit = 50) {
  return getTableData('AuditLogs')
    .filter(log => log.operatorName === operatorName)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// ========================================
// 排程管理 (Scheduling)
// ========================================

/**
 * 取得所有班次
 */
function dbGetShifts() {
  return getTableData('Shifts');
}

/**
 * 依日期取得班次
 */
function dbGetShiftsByDate(date) {
  return getTableData('Shifts').filter(s => s.shiftDate === date);
}

/**
 * 取得日期範圍內的班次
 */
function dbGetShiftsByDateRange(startDate, endDate) {
  return getTableData('Shifts').filter(s => s.shiftDate >= startDate && s.shiftDate <= endDate);
}

/**
 * 建立班次
 */
function dbCreateShift(data) {
  return insertRecord('Shifts', {
    shiftDate: data.shiftDate,
    shiftType: data.shiftType || 'day', // day, evening, night
    operatorId: data.operatorId || '',
    operatorName: data.operatorName || '',
    stationName: data.stationName || '',
    startTime: data.startTime || '08:00',
    endTime: data.endTime || '17:00',
    status: data.status || 'scheduled', // scheduled, confirmed, completed, cancelled
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  });
}

/**
 * 更新班次
 */
function dbUpdateShift(id, data) {
  return updateRecord('Shifts', id, data);
}

/**
 * 刪除班次
 */
function dbDeleteShift(id) {
  return deleteRecord('Shifts', id);
}

/**
 * 批次匯入班次
 * @param {Array} shifts - 班次陣列 [{ operatorId, operatorName, shiftDate, shiftType, notes }]
 * @returns {Object} { imported, skipped, total, errors }
 */
function dbImportShifts(shifts) {
  const existingShifts = dbGetShifts();
  let imported = 0;
  let skipped = 0;
  const errors = [];

  // 建立現有班次的快速查找表 (operatorId + shiftDate)
  const existingMap = {};
  existingShifts.forEach(s => {
    const key = `${s.operatorId}_${s.shiftDate}`;
    existingMap[key] = true;
  });

  shifts.forEach((shift, index) => {
    try {
      // 檢查必要欄位
      if (!shift.operatorId || !shift.shiftDate || !shift.shiftType) {
        errors.push({ row: index + 1, error: '缺少必要欄位 (operatorId, shiftDate, shiftType)' });
        skipped++;
        return;
      }

      // 檢查是否重複 (同一人同一天)
      const key = `${shift.operatorId}_${shift.shiftDate}`;
      if (existingMap[key]) {
        skipped++;
        return;
      }

      // 設定預設時間
      let startTime = shift.startTime;
      let endTime = shift.endTime;

      if (!startTime || !endTime) {
        switch (shift.shiftType) {
          case 'day':
            startTime = startTime || '08:00';
            endTime = endTime || '17:00';
            break;
          case 'evening':
            startTime = startTime || '16:00';
            endTime = endTime || '00:00';
            break;
          case 'night':
            startTime = startTime || '00:00';
            endTime = endTime || '08:00';
            break;
          default:
            startTime = startTime || '08:00';
            endTime = endTime || '17:00';
        }
      }

      // 建立班次
      dbCreateShift({
        shiftDate: shift.shiftDate,
        shiftType: shift.shiftType,
        operatorId: shift.operatorId,
        operatorName: shift.operatorName || '',
        stationName: shift.stationName || '',
        startTime: startTime,
        endTime: endTime,
        status: 'scheduled',
        notes: shift.notes || ''
      });

      imported++;
      existingMap[key] = true; // 加入已存在表防止同批次重複

    } catch (e) {
      errors.push({ row: index + 1, error: e.toString() });
      skipped++;
    }
  });

  return {
    imported,
    skipped,
    total: shifts.length,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 取得所有設備排程
 */
function dbGetEquipmentSchedules() {
  return getTableData('EquipmentSchedules');
}

/**
 * 依日期取得設備排程
 */
function dbGetEquipmentSchedulesByDate(date) {
  return getTableData('EquipmentSchedules').filter(s => s.scheduleDate === date);
}

/**
 * 建立設備排程
 */
function dbCreateEquipmentSchedule(data) {
  return insertRecord('EquipmentSchedules', {
    scheduleDate: data.scheduleDate,
    equipmentType: data.equipmentType || 'oven', // oven, station
    equipmentId: data.equipmentId || '',
    equipmentName: data.equipmentName || '',
    workOrderId: data.workOrderId || '',
    dispatchId: data.dispatchId || '',
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    status: data.status || 'scheduled', // scheduled, in_progress, completed, cancelled
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  });
}

/**
 * 更新設備排程
 */
function dbUpdateEquipmentSchedule(id, data) {
  return updateRecord('EquipmentSchedules', id, data);
}

/**
 * 刪除設備排程
 */
function dbDeleteEquipmentSchedule(id) {
  return deleteRecord('EquipmentSchedules', id);
}

/**
 * 取得所有排程計劃
 */
function dbGetSchedulePlans() {
  return getTableData('SchedulePlans');
}

/**
 * 建立排程計劃
 */
function dbCreateSchedulePlan(data) {
  return insertRecord('SchedulePlans', {
    planName: data.planName || '',
    planDate: data.planDate,
    planType: data.planType || 'daily', // daily, weekly
    totalDispatches: data.totalDispatches || 0,
    completedDispatches: data.completedDispatches || 0,
    status: data.status || 'draft', // draft, active, completed
    createdBy: data.createdBy || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  });
}

/**
 * 更新排程計劃
 */
function dbUpdateSchedulePlan(id, data) {
  return updateRecord('SchedulePlans', id, data);
}

/**
 * 計算排程統計
 */
function dbGetScheduleStats(date) {
  const shifts = dbGetShiftsByDate(date);
  const equipSchedules = dbGetEquipmentSchedulesByDate(date);
  const dispatches = getTableData('Dispatches').filter(d =>
    d.plannedStartAt && d.plannedStartAt.startsWith(date)
  );

  // 計算各班次人數
  const shiftCounts = {
    day: shifts.filter(s => s.shiftType === 'day').length,
    evening: shifts.filter(s => s.shiftType === 'evening').length,
    night: shifts.filter(s => s.shiftType === 'night').length
  };

  // 計算設備使用率
  const ovenSchedules = equipSchedules.filter(e => e.equipmentType === 'oven');
  const ovenUsage = ovenSchedules.length > 0 ? (ovenSchedules.length / 10 * 100).toFixed(0) : 0;

  // 計算派工統計
  const totalDispatches = dispatches.length;
  const completedDispatches = dispatches.filter(d => d.status === 'completed').length;
  const inProgressDispatches = dispatches.filter(d => d.status === 'in_progress').length;

  return {
    date,
    shifts: shiftCounts,
    totalShifts: shifts.length,
    ovenUsage: Number(ovenUsage),
    totalDispatches,
    completedDispatches,
    inProgressDispatches,
    completionRate: totalDispatches > 0 ? Math.round(completedDispatches / totalDispatches * 100) : 0
  };
}

