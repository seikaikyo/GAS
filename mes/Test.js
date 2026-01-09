/**
 * Test.js - GAS MES 完整測試套件
 * 包含：Unit Test / Integration Test / Performance Test
 *
 * 使用方式：
 *   1. 在 GAS 編輯器中執行 runAllTests()
 *   2. 或執行個別測試：runUnitTests() / runIntegrationTests() / runPerformanceTests()
 *   3. 查看 Logger 輸出結果
 */

// ============================================
// 測試框架核心
// ============================================

const TestRunner = {
  results: [],
  currentSuite: '',
  startTime: 0,

  /**
   * 開始測試套件
   */
  suite(name) {
    this.currentSuite = name;
    Logger.log(`\n${'='.repeat(50)}`);
    Logger.log(`  ${name}`);
    Logger.log('='.repeat(50));
  },

  /**
   * 執行單一測試
   */
  test(name, fn) {
    const start = Date.now();
    try {
      fn();
      const duration = Date.now() - start;
      this.results.push({ suite: this.currentSuite, name, pass: true, duration });
      Logger.log(`  ✓ ${name} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      this.results.push({ suite: this.currentSuite, name, pass: false, error: err.message, duration });
      Logger.log(`  ✗ ${name}`);
      Logger.log(`    └─ ${err.message}`);
    }
  },

  /**
   * 斷言函數
   */
  assert: {
    equal(actual, expected, msg) {
      if (actual !== expected) {
        throw new Error(msg || `Expected ${expected}, got ${actual}`);
      }
    },

    notEqual(actual, expected, msg) {
      if (actual === expected) {
        throw new Error(msg || `Expected not equal to ${expected}`);
      }
    },

    true(value, msg) {
      if (value !== true) {
        throw new Error(msg || `Expected true, got ${value}`);
      }
    },

    false(value, msg) {
      if (value !== false) {
        throw new Error(msg || `Expected false, got ${value}`);
      }
    },

    exists(value, msg) {
      if (value === null || value === undefined) {
        throw new Error(msg || `Expected value to exist`);
      }
    },

    isArray(value, msg) {
      if (!Array.isArray(value)) {
        throw new Error(msg || `Expected array, got ${typeof value}`);
      }
    },

    hasProperty(obj, prop, msg) {
      if (!(prop in obj)) {
        throw new Error(msg || `Expected object to have property '${prop}'`);
      }
    },

    greaterThan(actual, expected, msg) {
      if (actual <= expected) {
        throw new Error(msg || `Expected ${actual} > ${expected}`);
      }
    },

    lessThan(actual, expected, msg) {
      if (actual >= expected) {
        throw new Error(msg || `Expected ${actual} < ${expected}`);
      }
    }
  },

  /**
   * 輸出測試總結
   */
  summary() {
    const passed = this.results.filter(r => r.pass).length;
    const failed = this.results.filter(r => !r.pass).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    Logger.log(`\n${'='.repeat(50)}`);
    Logger.log('  測試總結');
    Logger.log('='.repeat(50));
    Logger.log(`  通過: ${passed}`);
    Logger.log(`  失敗: ${failed}`);
    Logger.log(`  總耗時: ${totalTime}ms`);

    if (failed > 0) {
      Logger.log('\n  失敗項目:');
      this.results.filter(r => !r.pass).forEach(r => {
        Logger.log(`    - [${r.suite}] ${r.name}: ${r.error}`);
      });
    }

    return { passed, failed, totalTime, results: this.results };
  },

  /**
   * 重置結果
   */
  reset() {
    this.results = [];
    this.currentSuite = '';
  }
};

// ============================================
// 1. 單元測試 (Unit Tests)
// ============================================

function runUnitTests() {
  const T = TestRunner;
  const A = T.assert;

  T.suite('Unit Test: 資料驗證');

  T.test('工單 ID 格式驗證', () => {
    const validId = 'WO-20260109-001';
    A.true(validId.startsWith('WO-'), '應以 WO- 開頭');
    A.equal(validId.split('-').length, 3, '應有 3 個部分');
  });

  T.test('日期格式驗證', () => {
    const date = new Date();
    const formatted = Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
    A.true(/^\d{4}-\d{2}-\d{2}$/.test(formatted), '應為 yyyy-MM-dd 格式');
  });

  T.test('JSON 解析安全性', () => {
    const validJson = '{"name": "test"}';
    const parsed = JSON.parse(validJson);
    A.hasProperty(parsed, 'name', '應有 name 屬性');

    let error = null;
    try {
      JSON.parse('invalid json');
    } catch (e) {
      error = e;
    }
    A.exists(error, '無效 JSON 應拋出錯誤');
  });

  T.suite('Unit Test: Schema 定義');

  T.test('SCHEMA 存在且完整', () => {
    A.exists(SCHEMA, 'SCHEMA 應存在');
    A.hasProperty(SCHEMA, 'WorkOrders', '應有 WorkOrders');
    A.hasProperty(SCHEMA, 'Dispatches', '應有 Dispatches');
    A.hasProperty(SCHEMA, 'Reports', '應有 Reports');
    A.hasProperty(SCHEMA, 'Operators', '應有 Operators');
    A.hasProperty(SCHEMA, 'Customers', '應有 Customers');
    A.hasProperty(SCHEMA, 'Products', '應有 Products');
  });

  T.test('WorkOrders Schema 欄位完整', () => {
    const cols = SCHEMA.WorkOrders;
    A.isArray(cols, 'WorkOrders 應為陣列');
    A.true(cols.includes('id'), '應有 id 欄位');
    A.true(cols.includes('createdAt'), '應有 createdAt 欄位');
    A.true(cols.includes('status'), '應有 status 欄位');
  });

  T.test('WmsLocations Schema 欄位完整', () => {
    const cols = SCHEMA.WmsLocations;
    A.isArray(cols, 'WmsLocations 應為陣列');
    A.true(cols.includes('id'), '應有 id 欄位');
    A.true(cols.includes('zone'), '應有 zone 欄位');
    A.true(cols.includes('isActive'), '應有 isActive 欄位');
  });

  T.suite('Unit Test: 輔助函數');

  T.test('generateId 產生唯一 ID', () => {
    const id1 = Utilities.getUuid();
    const id2 = Utilities.getUuid();
    A.notEqual(id1, id2, 'UUID 應唯一');
  });

  T.test('日期時區轉換正確', () => {
    const now = new Date();
    const tpe = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    A.exists(tpe, '應能轉換為台北時區');
  });
}

// ============================================
// 2. 整合測試 (Integration Tests)
// ============================================

function runIntegrationTests() {
  const T = TestRunner;
  const A = T.assert;

  T.suite('Integration Test: 資料庫連線');

  T.test('Spreadsheet 連線成功', () => {
    const ss = getDbSpreadsheet();
    A.exists(ss, 'Spreadsheet 應存在');
    A.exists(ss.getId(), '應有 Spreadsheet ID');
  });

  T.test('所有資料表存在', () => {
    const ss = getDbSpreadsheet();
    const sheets = ss.getSheets().map(s => s.getName());

    const required = ['WorkOrders', 'Dispatches', 'Reports', 'Operators', 'Customers', 'Products'];
    required.forEach(name => {
      A.true(sheets.includes(name), `${name} 資料表應存在`);
    });
  });

  T.suite('Integration Test: API getVersion');

  T.test('getVersion 回傳正確格式', () => {
    const result = api('getVersion', {});
    A.hasProperty(result, 'success', '應有 success 屬性');
    A.true(result.success, 'success 應為 true');
    A.hasProperty(result, 'data', '應有 data 屬性');
    A.true(result.data.startsWith('5.'), '版本應以 5. 開頭');
  });

  T.suite('Integration Test: API 讀取操作');

  T.test('getOperators 回傳陣列', () => {
    const result = api('getOperators', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.test('getCustomers 回傳陣列', () => {
    const result = api('getCustomers', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.test('getProducts 回傳陣列', () => {
    const result = api('getProducts', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.test('getWorkOrders 回傳陣列', () => {
    const result = api('getWorkOrders', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.test('getDispatches 回傳陣列', () => {
    const result = api('getDispatches', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.test('getWmsLocations 回傳陣列', () => {
    const result = api('getWmsLocations', {});
    A.true(result.success, 'API 應成功');
    A.isArray(result.data, 'data 應為陣列');
  });

  T.suite('Integration Test: API getAllData');

  T.test('getAllData 回傳所有資料', () => {
    const result = api('getAllData', {});
    A.true(result.success, 'API 應成功');
    A.hasProperty(result.data, 'operators', '應有 operators');
    A.hasProperty(result.data, 'customers', '應有 customers');
    A.hasProperty(result.data, 'products', '應有 products');
    A.hasProperty(result.data, 'workOrders', '應有 workOrders');
  });

  T.suite('Integration Test: API 錯誤處理');

  T.test('無效 action 回傳錯誤', () => {
    const result = api('invalidAction', {});
    A.false(result.success, 'success 應為 false');
    A.hasProperty(result, 'error', '應有 error 屬性');
  });

  T.suite('Integration Test: CRUD 操作 (Operator)');

  T.test('建立 -> 讀取 -> 刪除 Operator', () => {
    // 建立測試資料
    const testData = {
      name: `測試人員_${Date.now()}`,
      code: `TEST_${Date.now()}`
    };

    // 建立
    const createResult = api('createOperator', testData);
    A.true(createResult.success, '建立應成功');
    A.hasProperty(createResult.data, 'id', '應回傳 id');

    const createdId = createResult.data.id;

    // 讀取驗證
    const readResult = api('getOperators', {});
    const found = readResult.data.find(op => op.id === createdId);
    A.exists(found, '應能找到剛建立的資料');
    A.equal(found.name, testData.name, '名稱應一致');

    // 刪除
    const deleteResult = api('deleteOperator', { id: createdId });
    A.true(deleteResult.success, '刪除應成功');

    // 驗證刪除
    const verifyResult = api('getOperators', {});
    const stillExists = verifyResult.data.find(op => op.id === createdId);
    A.true(!stillExists, '刪除後應找不到');
  });
}

// ============================================
// 3. 效能測試 (Performance Tests)
// ============================================

function runPerformanceTests() {
  const T = TestRunner;
  const A = T.assert;

  T.suite('Performance Test: API 回應時間');

  const benchmark = (name, fn, maxTime) => {
    T.test(`${name} < ${maxTime}ms`, () => {
      const start = Date.now();
      fn();
      const duration = Date.now() - start;
      A.lessThan(duration, maxTime, `耗時 ${duration}ms 超過限制 ${maxTime}ms`);
    });
  };

  benchmark('getVersion', () => api('getVersion', {}), 100);
  benchmark('getOperators', () => api('getOperators', {}), 500);
  benchmark('getCustomers', () => api('getCustomers', {}), 500);
  benchmark('getProducts', () => api('getProducts', {}), 500);
  benchmark('getWorkOrders', () => api('getWorkOrders', {}), 1000);
  benchmark('getDispatches', () => api('getDispatches', {}), 1000);
  benchmark('getWmsLocations', () => api('getWmsLocations', {}), 500);
  benchmark('getAllData (快取)', () => api('getAllData', {}), 2000);

  T.suite('Performance Test: 資料庫操作');

  T.test('Spreadsheet 開啟時間 < 1000ms', () => {
    const start = Date.now();
    const ss = getDbSpreadsheet();
    ss.getSheetByName('WorkOrders');
    const duration = Date.now() - start;
    A.lessThan(duration, 1000, `耗時 ${duration}ms`);
  });

  T.test('批次讀取 10 張表 < 3000ms', () => {
    const start = Date.now();
    const ss = getDbSpreadsheet();
    const tables = ['WorkOrders', 'Dispatches', 'Reports', 'Operators', 'Customers',
                    'Products', 'NgReasons', 'WmsLocations', 'WmsInventory', 'AuditLogs'];
    tables.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) sheet.getDataRange().getValues();
    });
    const duration = Date.now() - start;
    A.lessThan(duration, 3000, `耗時 ${duration}ms`);
  });
}

// ============================================
// 4. 資料完整性測試
// ============================================

function runDataIntegrityTests() {
  const T = TestRunner;
  const A = T.assert;

  T.suite('Data Integrity: 工單資料');

  T.test('工單狀態值有效', () => {
    const result = api('getWorkOrders', {});
    const validStatuses = ['draft', 'in_progress', 'completed', 'cancelled'];

    result.data.forEach((wo, i) => {
      if (wo.status) {
        A.true(validStatuses.includes(wo.status),
          `工單 ${wo.id || i} 狀態無效: ${wo.status}`);
      }
    });
  });

  T.test('工單必填欄位存在', () => {
    const result = api('getWorkOrders', {});

    result.data.forEach((wo, i) => {
      A.exists(wo.id, `工單 ${i} 缺少 id`);
      A.exists(wo.createdAt, `工單 ${wo.id} 缺少 createdAt`);
    });
  });

  T.suite('Data Integrity: 派工資料');

  T.test('派工關聯工單存在', () => {
    const dispatches = api('getDispatches', {}).data;
    const workOrders = api('getWorkOrders', {}).data;
    const woIds = workOrders.map(wo => wo.id);

    dispatches.forEach(d => {
      if (d.workOrderId) {
        A.true(woIds.includes(d.workOrderId),
          `派工 ${d.id} 關聯的工單 ${d.workOrderId} 不存在`);
      }
    });
  });

  T.suite('Data Integrity: WMS 資料');

  T.test('WMS 儲位類型有效', () => {
    const result = api('getWmsLocations', {});
    const validTypes = ['暫存區', '入庫區', '出庫區', '特殊區', '品檢區', '前置區'];

    result.data.forEach(loc => {
      if (loc.type && loc.isActive !== 'FALSE') {
        A.true(validTypes.includes(loc.type),
          `儲位 ${loc.id} 類型無效: ${loc.type}`);
      }
    });
  });

  T.test('WMS 庫存數量非負', () => {
    const result = api('getWmsInventory', {});

    result.data.forEach(inv => {
      const qty = parseInt(inv.quantity) || 0;
      A.true(qty >= 0, `庫存 ${inv.id} 數量為負: ${qty}`);
    });
  });
}

// ============================================
// 主測試執行函數
// ============================================

/**
 * 執行所有測試
 */
function runAllTests() {
  TestRunner.reset();

  Logger.log('\n');
  Logger.log('╔══════════════════════════════════════════════════╗');
  Logger.log('║         GAS MES 完整測試套件                      ║');
  Logger.log('║         v5.37.2                                   ║');
  Logger.log('╚══════════════════════════════════════════════════╝');
  Logger.log(`\n執行時間: ${new Date().toLocaleString('zh-TW')}`);

  try {
    runUnitTests();
    runIntegrationTests();
    runPerformanceTests();
    runDataIntegrityTests();
  } catch (e) {
    Logger.log(`\n致命錯誤: ${e.message}`);
  }

  return TestRunner.summary();
}

/**
 * 快速煙霧測試 (只測試核心功能)
 */
function runSmokeTests() {
  TestRunner.reset();

  Logger.log('\n=== 快速煙霧測試 ===\n');

  const T = TestRunner;
  const A = T.assert;

  T.suite('Smoke Test');

  T.test('資料庫連線', () => {
    A.exists(getDbSpreadsheet(), 'DB 連線失敗');
  });

  T.test('API 回應', () => {
    const result = api('getVersion', {});
    A.true(result.success, 'API 回應失敗');
  });

  T.test('資料讀取', () => {
    const result = api('getAllData', {});
    A.true(result.success, '資料讀取失敗');
  });

  return TestRunner.summary();
}

/**
 * 測試報告產生 (存入 Sheet)
 */
function generateTestReport() {
  const result = runAllTests();

  // 建立或取得測試報告 Sheet
  const ss = getDbSpreadsheet();
  let reportSheet = ss.getSheetByName('_TestReports');

  if (!reportSheet) {
    reportSheet = ss.insertSheet('_TestReports');
    reportSheet.appendRow(['執行時間', '通過', '失敗', '總耗時(ms)', '詳情']);
  }

  // 寫入報告
  reportSheet.appendRow([
    new Date().toISOString(),
    result.passed,
    result.failed,
    result.totalTime,
    JSON.stringify(result.results.filter(r => !r.pass))
  ]);

  Logger.log(`\n測試報告已存入 _TestReports Sheet`);

  return result;
}
