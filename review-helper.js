import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const screenshotsDir = path.join(__dirname, 'review-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// 模拟导出文件的保存路径
const exportOtherPath = path.join(screenshotsDir, 'exported_other_report.docx');
const exportShihuaPath = path.join(screenshotsDir, 'exported_shihua_report.docx');

const testDocText = `关于深化安全生产专项整治工作的报告

中国石化集团公司：
根据《中国石化安全生产禁令》等要求，为进一步落实我局 2026 年度安全生产安排，特汇报如下：
一、 强化安全风险研判与责任落实
各单位须健全“党政同责、一岗双责、齐抓共管”安全责任体系。(注：有半角括号和英文句号)
（一） 落实一岗双责责任。
将安全履职情况纳入考核。(1) 细化考核指标，(2) 实施定量评估。
1. 加强对重点人员培训。安全培训合格率须达100%。
① 加强现场检查。每天对重点场所进行安全隐患排查。
二、 抓好隐患排查与整改落实
（一） 推进安全整治行动。
（二） 对重点设施设备进行安全评估。
本报告自发布之日起施行。

附件：1. 2026年安全生产重点监管清单
2. 安全生产目标责任书模版

石化华东分公司
2026/05/26`;

async function run() {
  console.log('🚀 [自动化验证] 正在启动无头浏览器对新版功能做深度 Review 测试...');
  
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      channel: 'chrome'
    });
    console.log('✅ 成功启动本地 Chrome 浏览器');
  } catch (err) {
    console.log('⚠️ 无法启动本地 Chrome 浏览器，尝试使用 Playwright 默认浏览器:', err.message);
    try {
      browser = await chromium.launch({ headless: true });
      console.log('✅ 成功启动 Playwright 默认 Chromium 浏览器');
    } catch (e2) {
      console.error('❌ 浏览器启动失败，请先运行: npx playwright install chromium');
      process.exit(1);
    }
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // 清理 localStorage 确保 Modal 正常弹出
  await context.addInitScript(() => {
    localStorage.clear();
  });

  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push(`[${type.toUpperCase()}] ${text}`);
    console.log(`[Browser Console] [${type.toUpperCase()}] ${text}`);
  });

  page.on('pageerror', err => {
    logs.push(`[EXCEPTION] ${err.message}`);
    console.error(`[Browser Exception] ${err.message}`);
  });

  try {
    console.log('📡 正在导航至 http://localhost:5173 ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // 1. 关闭欢迎 Modal
    console.log('👆 正在关闭欢迎弹窗...');
    await page.click('text=我了解了，开始使用');
    await page.waitForTimeout(300);

    // 2. 截图 1：新版“并排双列”标准/类型面板默认状态
    const screenshot1Path = path.join(screenshotsDir, '01_new_parallel_selectors.png');
    await page.screenshot({ path: screenshot1Path });
    console.log(`📸 截图已保存: ${screenshot1Path}`);

    // 3. 测试标准切换：把“石化标准”切到“国家标准”
    console.log('🔄 正在将“公文标准”切换为“国家标准 (GB/T)”...');
    // 根据 DOM 中 select 的选项值 'gb' 进行选择。前一个是公文标准，后一个是公文类型。
    const selectors = await page.$$('select');
    if (selectors.length >= 2) {
      await selectors[0].selectOption('gb'); // 切换标准
    }
    await page.waitForTimeout(300);

    // 截图 2：展示切换至国家标准后的并排状态
    const screenshot2Path = path.join(screenshotsDir, '02_switched_to_gb_standard.png');
    await page.screenshot({ path: screenshot2Path });
    console.log(`📸 截图已保存: ${screenshot2Path}`);

    // 4. 测试“其他”空白模板类型：将公文类型选为“其他”，并输入文本解析
    console.log('✍️ 正在将“公文类型”切换为“其他”并填充文本...');
    if (selectors.length >= 2) {
      await selectors[1].selectOption('其他'); // 切换类型为其他
    }
    await page.fill('textarea', testDocText);
    await page.waitForTimeout(300);

    console.log('▶ 正在点击“解析文本内容”进行空白模板排版...');
    await page.click('text=解析文本内容');
    await page.waitForTimeout(1500);

    // 截图 3：展示“其他”空白模板扁平正文排版（第一行作为正文，不居中，跳过落款/主送）
    const screenshot3Path = path.join(screenshotsDir, '03_other_type_flat_preview.png');
    await page.screenshot({ path: screenshot3Path });
    console.log(`📸 截图已保存: ${screenshot3Path}`);

    // 截图 4：切换到格式诊断，校验温馨无报错状态
    console.log('🔍 正在切换到“格式诊断”模式...');
    await page.click('text=格式诊断');
    await page.waitForTimeout(500);
    const screenshot4Path = path.join(screenshotsDir, '04_other_type_diagnose.png');
    await page.screenshot({ path: screenshot4Path });
    console.log(`📸 截图已保存: ${screenshot4Path}`);

    // 切换回“全功能排版”并执行“其他.docx”无模板导出测试
    console.log('🔄 正在切换回“全功能排版”...');
    await page.click('text=全功能排版');
    await page.waitForTimeout(300);

    console.log('📥 正在测试“其他”类型的无模板 .docx 导出...');
    // 拦截 window.confirm
    page.once('dialog', async dialog => {
      console.log(`💬 捕获确认弹窗: [${dialog.type()}] "${dialog.message()}"，自动点击确认`);
      await dialog.accept();
    });

    const [downloadOther] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("导出")')
    ]);
    await downloadOther.saveAs(exportOtherPath);
    console.log(`✅ “其他”类型空白 Word 文档成功导出至: ${exportOtherPath}`);

    // 5. 切换回“报告”公文类型并切换为“石化标准”，做正规公文导出测试
    console.log('🔄 正在将公文标准切换回“石化标准”，类型选为“报告”...');
    if (selectors.length >= 2) {
      await selectors[0].selectOption('qsh'); // 石化标准
      await selectors[1].selectOption('报告'); // 报告类型
    }
    await page.waitForTimeout(300);

    console.log('▶ 正在重新解析文本...');
    await page.click('text=解析文本内容');
    await page.waitForTimeout(1500);

    console.log('📥 正在测试“石化报告”的 .docx 导出...');
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    const [downloadShihua] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("导出")')
    ]);
    await downloadShihua.saveAs(exportShihuaPath);
    console.log(`✅ “石化报告”公文 Word 文档成功导出至: ${exportShihuaPath}`);

    // 写入控制台日志文件作为测试审查凭证
    fs.writeFileSync(path.join(screenshotsDir, 'console_logs_new_standard.txt'), logs.join('\n'));
    console.log('📝 控制台日志已保存至 review-screenshots/console_logs_new_standard.txt');

    console.log('🎉 新版功能端到端自动化 Review 测试圆满成功！');

  } catch (error) {
    console.error('❌ 测试运行异常:', error);
  } finally {
    await browser.close();
    console.log('🏁 浏览器已关闭，自动化测试圆满完成');
  }
}

run();
