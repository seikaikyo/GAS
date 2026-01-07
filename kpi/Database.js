/**
 * Database.js - KPI 管理定義盤點 資料庫操作層
 */

const DB_CONFIG = {
  sheets: {
    kpis: {
      name: 'KPIs',
      headers: [
        'id', 'department', 'author', 'kpiType', 'name', 'purpose',
        'frequency', 'calcDescription', 'numerator', 'denominator',
        'includeConditions', 'excludeConditions', 'targetValue',
        'achievementCriteria', 'usageMethod', 'dataSource',
        'needManualData', 'notes', 'createdAt', 'updatedAt'
      ]
    }
  }
};

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
      console.warn('無法開啟原有試算表:', e);
      props.deleteProperty('DB_SPREADSHEET_ID');
    }
  }

  if (!ss) {
    console.log('建立新的 KPI 資料庫試算表...');
    ss = SpreadsheetApp.create('KPI_管理定義盤點_再生部');
    const newId = ss.getId();
    props.setProperty('DB_SPREADSHEET_ID', newId);
    console.log('新資料庫已建立，ID:', newId);
  }

  return ss;
}

/**
 * 初始化資料庫
 */
function initDatabase() {
  const ss = getDbSpreadsheet();

  Object.keys(DB_CONFIG.sheets).forEach(key => {
    const config = DB_CONFIG.sheets[key];
    let sheet = ss.getSheetByName(config.name);

    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, config.headers.length)
           .setFontWeight('bold')
           .setBackground('#4285F4')
           .setFontColor('#FFFFFF');

      // 設定欄寬
      sheet.setColumnWidth(1, 120);  // id
      sheet.setColumnWidth(2, 200);  // name
      sheet.setColumnWidth(3, 300);  // purpose
      sheet.setColumnWidth(4, 200);  // numerator
      sheet.setColumnWidth(5, 200);  // denominator
      sheet.setColumnWidth(6, 250);  // conditions
      sheet.setColumnWidth(7, 100);  // frequency
      sheet.setColumnWidth(8, 250);  // exceptions
    } else {
      // 同步欄位
      const lastCol = sheet.getLastColumn();
      const existingHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      config.headers.forEach(header => {
        if (!existingHeaders.includes(header)) {
          const newCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, newCol).setValue(header).setFontWeight('bold');
        }
      });
    }
  });

  // 刪除預設的 Sheet1
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('工作表1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  return { success: true, message: '資料庫初始化完成', url: ss.getUrl() };
}

/**
 * 通用：取得資料
 */
function getTableData(tableName) {
  const ss = getDbSpreadsheet();
  const config = Object.values(DB_CONFIG.sheets).find(s => s.name === tableName);
  if (!config) throw new Error(`Table ${tableName} not found`);

  let sheet = ss.getSheetByName(tableName);
  if (!sheet) {
    initDatabase();
    sheet = ss.getSheetByName(tableName);
  }

  if (!sheet || sheet.getLastRow() < 2) return [];

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

  const lastCol = sheet.getLastColumn();
  const sheetHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : config.headers;

  const row = sheetHeaders.map(header => {
    return record[header] !== undefined ? record[header] : '';
  });

  sheet.appendRow(row);
  return record;
}

/**
 * 通用：更新資料
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
      return true;
    }
  }
  return false;
}

/**
 * 通用：刪除資料
 */
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
      return true;
    }
  }
  return false;
}

// KPI CRUD
function dbGetKpis() {
  return getTableData('KPIs');
}

function dbCreateKpi(data) {
  return insertRecord('KPIs', data);
}

function dbUpdateKpi(id, data) {
  return updateRecord('KPIs', id, data);
}

function dbDeleteKpi(id) {
  return deleteRecord('KPIs', id);
}
