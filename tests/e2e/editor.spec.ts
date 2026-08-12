import { expect, test } from '@playwright/test';

const documentText = [
  '关于测试工作的通知。',
  '各部门：',
  '三、原始序号',
  '请按要求完成测试。',
  '测试办公室',
  '2026年8月12日',
].join('\n');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('shihua_doc_formatter_visited', 'true'));
  await page.goto('/');
});

test('processes, previews and exports a document fully offline', async ({ page }) => {
  await page.getByRole('textbox', { name: /在此粘贴公文文字/ }).fill(documentText);
  await page.getByRole('button', { name: /解析文本内容/ }).click();

  await expect(page.getByText('关于测试工作的通知', { exact: true })).toBeVisible();
  await expect(page.getByText('一、原始序号', { exact: true })).toBeVisible();
  await expect(page.getByText('✔️ 落款日期已识别')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /导出/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('关于测试工作的通知.docx');
});

test('diagnose and quick-fix modes preserve the original outline numbering', async ({ page }) => {
  const input = page.getByRole('textbox', { name: /在此粘贴公文文字/ });
  await input.fill(documentText);

  await page.getByRole('button', { name: '快速修复' }).click();
  await page.getByRole('button', { name: /解析文本内容/ }).click();
  await expect(page.getByText('三、原始序号', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '格式诊断' }).click();
  await page.getByRole('button', { name: /解析文本内容/ }).click();
  await expect(page.getByRole('heading', { name: /格式诊断报告/ })).toBeVisible();
});
