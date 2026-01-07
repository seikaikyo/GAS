/**
 * Database.js - KPI 管理定義盤點 資料庫操作層
 */

const DB_CONFIG = {
  sheets: {
    kpis: {
      name: 'KPIs',
      headers: [
        'id', 'ownerAccount', 'ownerPassword', 'department', 'author', 'kpiType', 'name', 'purpose',
        'frequency', 'calcDescription', 'numerator', 'denominator',
        'includeConditions', 'excludeConditions', 'targetValue',
        'achievementCriteria', 'usageMethod', 'dataSource',
        'needManualData', 'notes', 'createdAt', 'updatedAt'
      ]
    }
  }
};

// 管理員帳號（從 Script Properties 讀取）
function getAdminCredentials() {
  const props = PropertiesService.getScriptProperties();
  return {
    account: props.getProperty('ADMIN_ACCOUNT') || 'admin',
    password: props.getProperty('ADMIN_PASSWORD') || 'changeme'
  };
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

// 驗證登入
function dbVerifyLogin(account, password) {
  // 管理員帳號
  const admin = getAdminCredentials();
  if (account === admin.account && password === admin.password) {
    return { success: true, isAdmin: true };
  }

  // 檢查是否有此帳號的資料
  const allKpis = getTableData('KPIs');
  const userKpis = allKpis.filter(k => k.ownerAccount === account && k.ownerPassword === password);

  if (userKpis.length > 0) {
    return { success: true, isAdmin: false };
  }

  // 帳號存在但密碼錯誤
  const accountExists = allKpis.some(k => k.ownerAccount === account);
  if (accountExists) {
    return { success: false, error: '密碼錯誤' };
  }

  // 新帳號（匯入時會建立）
  return { success: true, isAdmin: false, isNew: true };
}

// 取得公開摘要（未登入可看，內容馬賽克）
function dbGetKpiSummary() {
  const allKpis = getTableData('KPIs');

  // 依帳號分組統計
  const accountStats = {};
  allKpis.forEach(k => {
    const acc = k.ownerAccount || '未設定';
    if (!accountStats[acc]) {
      accountStats[acc] = { count: 0, departments: new Set(), types: new Set() };
    }
    accountStats[acc].count++;
    if (k.department) accountStats[acc].departments.add(k.department);
    if (k.kpiType) accountStats[acc].types.add(k.kpiType);
  });

  // 轉換為陣列
  const summary = Object.entries(accountStats).map(([account, stats]) => ({
    account,
    count: stats.count,
    departments: Array.from(stats.departments),
    types: Array.from(stats.types)
  }));

  // 馬賽克版 KPI 列表
  const maskedKpis = allKpis.map(k => ({
    id: k.id,
    ownerAccount: k.ownerAccount,
    department: k.department,
    kpiType: k.kpiType,
    name: maskText(k.name),
    purpose: maskText(k.purpose),
    frequency: k.frequency,
    author: maskText(k.author),
    targetValue: k.targetValue ? '***' : ''
  }));

  return { summary, maskedKpis };
}

// 文字馬賽克
function maskText(text) {
  if (!text) return '';
  const str = String(text);
  if (str.length <= 2) return '**';
  return str.charAt(0) + '*'.repeat(Math.min(str.length - 2, 6)) + str.charAt(str.length - 1);
}

// KPI CRUD
function dbGetKpis(account, password) {
  const allKpis = getTableData('KPIs');
  const admin = getAdminCredentials();

  // 管理員看全部（隱藏密碼欄位）
  if (account === admin.account && password === admin.password) {
    return allKpis.map(k => ({ ...k, ownerPassword: '***' }));
  }

  // 一般使用者只看自己的
  if (account && password) {
    return allKpis.filter(k => k.ownerAccount === account && k.ownerPassword === password);
  }

  // 未登入不給資料
  return [];
}

function dbCreateKpi(data) {
  return insertRecord('KPIs', data);
}

function dbUpdateKpi(id, data, account, password) {
  // 驗證權限
  const allKpis = getTableData('KPIs');
  const kpi = allKpis.find(k => k.id === id);
  const admin = getAdminCredentials();

  if (!kpi) return { success: false, error: '找不到此 KPI' };

  // 管理員可編輯全部
  const isAdmin = account === admin.account && password === admin.password;
  // 擁有者可編輯自己的
  const isOwner = kpi.ownerAccount === account && kpi.ownerPassword === password;

  if (!isAdmin && !isOwner) {
    return { success: false, error: '無權限編輯此 KPI' };
  }

  return updateRecord('KPIs', id, data);
}

function dbDeleteKpi(id, account, password) {
  // 驗證權限
  const allKpis = getTableData('KPIs');
  const kpi = allKpis.find(k => k.id === id);
  const admin = getAdminCredentials();

  if (!kpi) return { success: false, error: '找不到此 KPI' };

  // 管理員可刪除全部
  const isAdmin = account === admin.account && password === admin.password;
  // 擁有者可刪除自己的
  const isOwner = kpi.ownerAccount === account && kpi.ownerPassword === password;

  if (!isAdmin && !isOwner) {
    return { success: false, error: '無權限刪除此 KPI' };
  }

  return deleteRecord('KPIs', id);
}
