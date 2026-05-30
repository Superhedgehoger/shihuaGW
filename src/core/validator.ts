import type { DocumentStructure, ValidationResult } from '../types/document';
import type { FontReport } from './fontChecker';

/**
 * 规范校验引擎
 * 针对当前提取到的 DocumentStructure，生成核心内容的校验结果。
 * 校验失败项将在 UI 上展示，且若是 'error' 级别，会阻塞导出。
 *
 * @param structure 识别出的公文结构
 * @param fontReport 可选的字体检测报告（含结构字段的 structureIssues）
 */
export function validateStructure(
  structure: DocumentStructure,
  fontReport?: FontReport | null
): ValidationResult[] {
  const results: ValidationResult[] = [];

  const addResult = (id: string, passed: boolean, level: ValidationResult['level'], message: string) => {
    results.push({ id, passed, level, message });
  };

  // ── 1. 通用检查（所有类型） ──
  if (structure.docType !== '其他') {
    addResult('has-title', !!structure.title, 'error',
      structure.title ? '✔️ 已具备主标题' : '❌ 缺少主标题');
    addResult('has-body', structure.body.length > 0, 'error',
      structure.body.length > 0 ? '✔️ 已具备正文内容' : '❌ 缺少正文内容');
  } else {
    addResult('has-body', structure.body.length > 0, 'error',
      structure.body.length > 0 ? '✔️ 已具备内容' : '❌ 缺少内容');
  }

  // ── 2. 结构必填项校验：扩展到所有严格公文类型 ──
  // NOTE: 主送机关为 warning（部分公文确实可不填），落款日期/机关为 error（法定必需）
  const strictDocTypes = ['红头文件', '报告', '请示', '通知', '函', '批复', '决定', '通报', '意见'];
  if (strictDocTypes.includes(structure.docType)) {
    addResult('has-salutation', !!structure.salutation, 'warning',
      structure.salutation ? '✔️ 主送机关已识别' : `⚠️ 未识别到主送机关（${structure.docType}通常需要）`);

    addResult('has-signoff-org', !!structure.signoff?.organization, 'error',
      structure.signoff?.organization ? '✔️ 落款机关已识别' : `❌ 缺少落款机关（${structure.docType}必填）`);

    addResult('has-signoff-date', !!structure.signoff?.date, 'error',
      structure.signoff?.date ? '✔️ 落款日期已识别' : `❌ 缺少落款日期（${structure.docType}必填）`);
  }

  // ── 3. 字体规范校验 ──
  // 统计正文块（body）中不合规的字体问题
  let fontIssueCount = 0;
  let hasExtractedFonts = false;

  for (const block of structure.body) {
    if (block.fontInfo !== undefined) hasExtractedFonts = true;
    if ((block as any).fontCompliant === false) {
      fontIssueCount += ((block as any).fontIssues?.length || 1);
    }
  }

  // NOTE: 同时纳入结构字段（标题、落款等）的字体问题
  // 这确保了诊断面板和核心校验面板的字体问题数量保持一致
  if (fontReport?.structureIssues) {
    const sIssues = fontReport.structureIssues;
    fontIssueCount += (sIssues.title?.length || 0);
    fontIssueCount += (sIssues.salutation?.length || 0);
    fontIssueCount += (sIssues.signoffOrg?.length || 0);
    fontIssueCount += (sIssues.signoffDate?.length || 0);
    // 若存在结构字体信息，视为已提取字体
    if (Object.keys(fontReport.structureIssues).length > 0 || fontReport.totalBlocks > 0) {
      hasExtractedFonts = true;
    }
  }

  if (hasExtractedFonts) {
    addResult('font-compliance', fontIssueCount === 0, 'warning',
      fontIssueCount === 0
        ? '✔️ 字体排版符合规范'
        : `⚠️ 发现 ${fontIssueCount} 处字体排版不规范`);
  }

  return results;
}
