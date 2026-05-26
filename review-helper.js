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
const exportPath = path.join(screenshotsDir, 'exported_report.docx');

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
  console.log('🚀 [子任务 2] 正在启动无头浏览器进行深度 Review 自动测试...');
  
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

  // 1. 注入脚本：启动时清除 localStorage 确保欢迎 Modal 会显示
  await context.addInitScript(() => {
    localStorage.clear();
  });

  const page = await context.newPage();

  // 监听 console
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
    console.log('✅ 成功加载页面');

    // 等待欢迎 Modal 渲染出来
    await page.waitForTimeout(500);

    // 截图 1：首次载入的「欢迎引导弹窗」
    const screenshot1Path = path.join(screenshotsDir, '01_welcome_modal.png');
    await page.screenshot({ path: screenshot1Path });
    console.log(`📸 截图已保存: ${screenshot1Path}`);

    // 点击“我了解了，开始使用”按钮关闭 Modal
    console.log('👆 正在关闭欢迎弹窗...');
    await page.click('text=我了解了，开始使用');
    await page.waitForTimeout(300);

    // 截图 2：弹窗关闭后的主编辑界面（默认“报告”类型）
    const screenshot2Path = path.join(screenshotsDir, '02_empty_state_report.png');
    await page.screenshot({ path: screenshot2Path });
    console.log(`📸 截图已保存: ${screenshot2Path}`);

    // 填充测试文本到 textarea 中
    console.log('✍️ 正在填充多缺陷公文测试文本...');
    await page.fill('textarea', testDocText);
    await page.waitForTimeout(300);

    // 截图 3：粘贴文本后的待解析状态
    const screenshot3Path = path.join(screenshotsDir, '03_text_filled.png');
    await page.screenshot({ path: screenshot3Path });
    console.log(`📸 截图已保存: ${screenshot3Path}`);

    // 点击“▶ 解析文本内容”按钮
    console.log('▶ 正在点击“解析文本内容”...');
    await page.click('text=解析文本内容');
    // 等待 1500ms 让自动排版引擎与诊断逻辑执行完毕
    await page.waitForTimeout(1500);

    // 截图 4：解析并格式化后的「A4 实时预览」及「校验面板」
    const screenshot4Path = path.join(screenshotsDir, '04_parsed_a4_preview.png');
    await page.screenshot({ path: screenshot4Path });
    console.log(`📸 截图已保存: ${screenshot4Path}`);

    // 切换到「格式诊断」模式
    console.log('🔍 正在切换到“格式诊断”模式...');
    await page.click('text=格式诊断');
    await page.waitForTimeout(500);

    // 截图 5：格式诊断报告面板
    const screenshot5Path = path.join(screenshotsDir, '05_diagnose_report_panel.png');
    await page.screenshot({ path: screenshot5Path });
    console.log(`📸 截图已保存: ${screenshot5Path}`);

    // 切换回「全功能排版」
    console.log('🔄 正在切换回“全功能排版”...');
    await page.click('text=全功能排版');
    await page.waitForTimeout(300);

    // 点击“📥 导出”按钮进行导出测试，拦截下载事件
    console.log('📥 正在测试 .docx 导出...');
    
    // 因为点击导出可能会触发 window.confirm。我们在 window.confirm 被触发时自动返回 true（接受）
    page.once('dialog', async dialog => {
      console.log(`💬 捕获到弹窗: [${dialog.type()}] "${dialog.message()}"，正在点击 [确认]`);
      await dialog.accept();
    });

    const [download] = await Promise.all([
      page.waitForEvent('download'), // 等待下载事件触发
      page.click('button:has-text("导出")') // 点击导出按钮
    ]);

    // 保存导出的文件
    await download.saveAs(exportPath);
    console.log(`✅ 导出的 Word 文档成功保存至: ${exportPath}`);

    // 把 console log 写入 review-screenshots 目录
    fs.writeFileSync(path.join(screenshotsDir, 'console_logs_interactive.txt'), logs.join('\n'));
    console.log('📝 控制台日志已保存至 review-screenshots/console_logs_interactive.txt');

    console.log('🎉 所有自动化交互与测试步骤圆满成功！');

  } catch (error) {
    console.error('❌ 测试过程中发生异常:', error);
  } finally {
    await browser.close();
    console.log('🏁 浏览器已关闭，子任务 2 运行完毕');
  }
}

run();
