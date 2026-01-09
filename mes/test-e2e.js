/**
 * GAS MES E2E 測試工具
 * 針對 MES 系統各頁籤進行自動化測試
 *
 * 使用方式：
 *   node test-e2e.js [--tab=settings] [--screenshot]
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 設定
const CONFIG = {
  url: 'https://script.google.com/macros/s/AKfycbwbX1uACKWhzRhe8JxlXwKEWbZ7ysduAQtf2R2drxIZm5X6acMX7WFUMEpCGouPELoKYw/exec',
  timeout: 60000,
  waitAfterLoad: 8000,
  screenshotDir: '/tmp/mes-screenshots',

  // 頁籤對應
  tabs: {
    'schedule': '排程看板',
    'work-orders': '工單管理',
    'dispatches': '現場派工',
    'reports': '報工紀錄',
    'outgassing': '釋氣檢驗',
    'aoi': 'AOI 檢驗',
    'r0': '標籤管理',
    'label-editor': '樣式設計',
    'oven': '烘箱監控',
    'wms': '倉儲管理',
    'settings': '設定'
  },

  // 各頁籤的測試項目
  tests: {
    'settings': {
      name: '設定頁',
      checks: [
        { type: 'element', selector: '.settings-section', description: '設定區塊存在' },
        { type: 'element', selector: '.settings-form', description: '設定表單存在' },
        { type: 'inputStyle', selector: '.settings-form input.input', description: '輸入欄位樣式正確' },
        { type: 'buttonVisible', selector: '.settings-form .btn', description: '按鈕文字可見' },
        { type: 'element', selector: '.admin-grid', description: '系統工具區塊存在' },
        { type: 'element', selector: '.changelog-container', description: '更新歷程存在' },
      ]
    },
    'r0': {
      name: '標籤管理',
      checks: [
        { type: 'element', selector: '.form-actions', description: 'form-actions 存在' },
        { type: 'flexAlign', selector: '.form-actions', description: '按鈕對齊正確' },
        { type: 'buttonVisible', selector: '.form-actions .btn', description: '按鈕文字可見' },
        { type: 'element', selector: 'select, .select', description: '工單選擇器存在' },
      ]
    },
    'wms': {
      name: '倉儲管理',
      checks: [
        { type: 'element', selector: '.wms-dashboard, .empty-state, .loading', description: 'WMS 內容載入' },
        { type: 'noInitButton', selector: 'button', text: '初始化', description: '無多餘初始化按鈕' },
      ]
    },
    'schedule': {
      name: '排程看板',
      checks: [
        { type: 'element', selector: '.schedule-dashboard', description: 'Dashboard 存在' },
        { type: 'buttonVisible', selector: '.schedule-dashboard .btn', description: '按鈕文字可見' },
        { type: 'darkThemeInput', selector: '.schedule-dashboard input', description: '深色主題輸入欄位' },
      ]
    },
    'work-orders': {
      name: '工單管理',
      checks: [
        { type: 'element', selector: '.data-table, .empty-state', description: '工單列表或空狀態' },
        { type: 'buttonVisible', selector: '.btn', description: '按鈕文字可見' },
      ]
    },
    'dispatches': {
      name: '現場派工',
      checks: [
        { type: 'element', selector: '.dispatch-card, .empty-state', description: '派工卡片或空狀態' },
      ]
    },
    'reports': {
      name: '報工紀錄',
      checks: [
        { type: 'element', selector: '.data-table, .empty-state', description: '報工列表或空狀態' },
      ]
    },
    'aoi': {
      name: 'AOI 檢驗',
      checks: [
        { type: 'element', selector: '.data-table, .empty-state, form', description: 'AOI 內容載入' },
      ]
    },
    'oven': {
      name: '烘箱監控',
      checks: [
        { type: 'element', selector: '.oven-card, .empty-state', description: '烘箱卡片或空狀態' },
      ]
    }
  }
};

// 確保截圖目錄存在
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

/**
 * 主測試函數
 */
async function runTests(options = {}) {
  const { targetTab, takeScreenshots } = options;
  const results = [];
  let browser;

  console.log('\n========================================');
  console.log('  GAS MES E2E 測試');
  console.log('========================================\n');

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 收集 console 錯誤
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Framing')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.toString());
    });

    // 載入頁面
    console.log(`載入 MES 系統...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
    await sleep(CONFIG.waitAfterLoad);

    // 取得 Vue frame 和版本號
    const vueFrame = await getVueFrame(page);
    const version = await vueFrame.evaluate(() => {
      const badge = document.querySelector('.version-badge');
      return badge ? badge.textContent : 'unknown';
    });
    console.log(`版本: ${version}\n`);

    // 決定要測試的頁籤
    const tabsToTest = targetTab ? [targetTab] : Object.keys(CONFIG.tests);

    for (const tabKey of tabsToTest) {
      const testConfig = CONFIG.tests[tabKey];
      if (!testConfig) {
        console.log(`跳過 ${tabKey} (無測試設定)`);
        continue;
      }

      console.log(`\n--- ${testConfig.name} (${tabKey}) ---`);

      // 切換到該頁籤
      const switched = await switchTab(page, tabKey);
      if (!switched) {
        results.push({ tab: tabKey, name: testConfig.name, success: false, error: '無法切換頁籤' });
        continue;
      }

      await sleep(2000);

      // 截圖
      if (takeScreenshots) {
        const screenshotPath = path.join(CONFIG.screenshotDir, `${tabKey}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`  截圖: ${screenshotPath}`);
      }

      // 執行各項檢查 (使用正確的 frame)
      const tabResults = { tab: tabKey, name: testConfig.name, checks: [] };
      const vueFrame = await getVueFrame(page);

      for (const check of testConfig.checks) {
        const result = await runCheck(vueFrame, check);
        tabResults.checks.push(result);
        const icon = result.pass ? '✓' : '✗';
        console.log(`  ${icon} ${check.description}`);
        if (!result.pass && result.detail) {
          console.log(`    └─ ${result.detail}`);
        }
      }

      tabResults.success = tabResults.checks.every(c => c.pass);
      results.push(tabResults);
    }

    // 輸出 JS 錯誤
    if (consoleErrors.length > 0) {
      console.log('\n--- JS 錯誤 ---');
      consoleErrors.forEach(e => console.log(`  ✗ ${e.substring(0, 100)}`));
    }

    // 總結
    console.log('\n========================================');
    console.log('  測試結果');
    console.log('========================================');

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`  通過: ${passed}`);
    console.log(`  失敗: ${failed}`);
    console.log(`  JS 錯誤: ${consoleErrors.length}`);

    if (takeScreenshots) {
      console.log(`\n  截圖目錄: ${CONFIG.screenshotDir}`);
    }

    return { results, consoleErrors, version };

  } catch (err) {
    console.error(`測試錯誤: ${err.message}`);
    return { error: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 取得 Vue iframe (GAS 架構會有多層 iframe)
 */
async function getVueFrame(page) {
  const frames = page.frames();
  // GAS 的 Vue 內容通常在第三個 frame (index 2)
  for (let i = frames.length - 1; i >= 0; i--) {
    try {
      const hasContent = await frames[i].evaluate(() => {
        return document.querySelector('.tabs-nav') !== null ||
               document.querySelector('.nav-tab') !== null ||
               document.querySelector('a span') !== null;
      });
      if (hasContent) return frames[i];
    } catch (e) {
      continue;
    }
  }
  return page; // fallback to main page
}

/**
 * 切換頁籤
 */
async function switchTab(page, tabKey) {
  const frame = await getVueFrame(page);
  const tabName = CONFIG.tabs[tabKey];

  return await frame.evaluate((name) => {
    // 尋找包含該文字的頁籤連結並點擊
    const links = document.querySelectorAll('a');
    for (const link of links) {
      const span = link.querySelector('span');
      if (span && span.textContent.includes(name)) {
        link.click();
        return true;
      }
      // 也檢查直接文字
      if (link.textContent.includes(name)) {
        link.click();
        return true;
      }
    }
    return false;
  }, tabName);
}

/**
 * 執行單項檢查
 */
async function runCheck(page, check) {
  try {
    switch (check.type) {
      case 'element':
        return await checkElement(page, check);
      case 'inputStyle':
        return await checkInputStyle(page, check);
      case 'buttonVisible':
        return await checkButtonVisible(page, check);
      case 'flexAlign':
        return await checkFlexAlign(page, check);
      case 'noInitButton':
        return await checkNoInitButton(page, check);
      case 'darkThemeInput':
        return await checkDarkThemeInput(page, check);
      default:
        return { pass: false, detail: `未知檢查類型: ${check.type}` };
    }
  } catch (err) {
    return { pass: false, detail: err.message };
  }
}

/**
 * 檢查元素是否存在
 */
async function checkElement(page, check) {
  const exists = await page.evaluate((selector) => {
    return document.querySelector(selector) !== null;
  }, check.selector);

  return { pass: exists, detail: exists ? null : `找不到 ${check.selector}` };
}

/**
 * 檢查輸入欄位樣式
 */
async function checkInputStyle(page, check) {
  const result = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    if (!input) return { found: false };

    const style = window.getComputedStyle(input);
    const bgColor = style.backgroundColor;
    const textColor = style.color;

    // 檢查背景是否為白色系 (rgb 值都 > 240)
    const bgMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const isLightBg = bgMatch &&
      parseInt(bgMatch[1]) > 240 &&
      parseInt(bgMatch[2]) > 240 &&
      parseInt(bgMatch[3]) > 240;

    // 檢查文字是否為深色 (rgb 值都 < 100)
    const textMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const isDarkText = textMatch &&
      parseInt(textMatch[1]) < 100 &&
      parseInt(textMatch[2]) < 100 &&
      parseInt(textMatch[3]) < 100;

    return {
      found: true,
      bgColor,
      textColor,
      isLightBg,
      isDarkText,
      pass: isLightBg && isDarkText
    };
  }, check.selector);

  if (!result.found) {
    return { pass: false, detail: `找不到 ${check.selector}` };
  }

  if (!result.pass) {
    return {
      pass: false,
      detail: `背景: ${result.bgColor}, 文字: ${result.textColor}`
    };
  }

  return { pass: true };
}

/**
 * 檢查按鈕文字是否可見
 */
async function checkButtonVisible(page, check) {
  const result = await page.evaluate((selector) => {
    const buttons = document.querySelectorAll(selector);
    if (buttons.length === 0) return { found: false };

    const issues = [];
    buttons.forEach((btn, i) => {
      const style = window.getComputedStyle(btn);
      const color = style.color;
      const bgColor = style.backgroundColor;

      // 簡單對比度檢查
      const colorMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      const bgMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

      if (colorMatch && bgMatch) {
        const colorBrightness = (parseInt(colorMatch[1]) + parseInt(colorMatch[2]) + parseInt(colorMatch[3])) / 3;
        const bgBrightness = (parseInt(bgMatch[1]) + parseInt(bgMatch[2]) + parseInt(bgMatch[3])) / 3;
        const contrast = Math.abs(colorBrightness - bgBrightness);

        if (contrast < 50) {
          issues.push(`按鈕 ${i + 1}: 對比度不足 (${Math.round(contrast)})`);
        }
      }
    });

    return { found: true, count: buttons.length, issues };
  }, check.selector);

  if (!result.found) {
    return { pass: false, detail: `找不到 ${check.selector}` };
  }

  if (result.issues.length > 0) {
    return { pass: false, detail: result.issues.join(', ') };
  }

  return { pass: true, detail: `${result.count} 個按鈕` };
}

/**
 * 檢查 Flex 對齊
 */
async function checkFlexAlign(page, check) {
  const result = await page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return { found: false };

    const style = window.getComputedStyle(el);
    const display = style.display;
    const alignItems = style.alignItems;

    return {
      found: true,
      display,
      alignItems,
      pass: display === 'flex' && alignItems === 'center'
    };
  }, check.selector);

  if (!result.found) {
    return { pass: false, detail: `找不到 ${check.selector}` };
  }

  if (!result.pass) {
    return {
      pass: false,
      detail: `display: ${result.display}, align-items: ${result.alignItems}`
    };
  }

  return { pass: true };
}

/**
 * 檢查深色主題輸入欄位 (預期淺色文字)
 */
async function checkDarkThemeInput(page, check) {
  const result = await page.evaluate((selector) => {
    const input = document.querySelector(selector);
    if (!input) return { found: false };

    const style = window.getComputedStyle(input);
    const textColor = style.color;

    // 檢查文字是否為淺色 (rgb 值都 > 200)
    const textMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const isLightText = textMatch &&
      parseInt(textMatch[1]) > 200 &&
      parseInt(textMatch[2]) > 200 &&
      parseInt(textMatch[3]) > 200;

    return {
      found: true,
      textColor,
      isLightText,
      pass: isLightText
    };
  }, check.selector);

  if (!result.found) {
    return { pass: true, detail: '無輸入欄位 (正常)' }; // 沒有輸入欄位也算通過
  }

  if (!result.pass) {
    return { pass: false, detail: `文字顏色: ${result.textColor} (應為淺色)` };
  }

  return { pass: true };
}

/**
 * 檢查沒有多餘的初始化按鈕
 */
async function checkNoInitButton(page, check) {
  const hasInitButton = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('初始化') && !btn.textContent.includes('重新')) {
        // 檢查按鈕是否可見
        const style = window.getComputedStyle(btn);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          return true;
        }
      }
    }
    return false;
  });

  return {
    pass: !hasInitButton,
    detail: hasInitButton ? '發現初始化按鈕' : null
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI 執行
const args = process.argv.slice(2);
const options = {
  targetTab: null,
  takeScreenshots: false
};

args.forEach(arg => {
  if (arg.startsWith('--tab=')) {
    options.targetTab = arg.split('=')[1];
  } else if (arg === '--screenshot' || arg === '-s') {
    options.takeScreenshots = true;
  }
});

runTests(options).then(result => {
  if (result.error) {
    process.exit(1);
  }
  const hasFailures = result.results?.some(r => !r.success) || result.consoleErrors?.length > 0;
  process.exit(hasFailures ? 1 : 0);
});
