import type { DocumentStructure, ValidationResult } from '../types/document';

/**
 * 规范校验引擎
 * 针对当前提取到的 DocumentStructure，生成核心内容的校验结果。
 * 校验失败项将在 UI 上展示，并且若是 'error' 级别，可能会阻塞导出。
 * 
 * @param structure 识别出的公文结构
 */
export function validateStructure(structure: DocumentStructure): ValidationResult[] {
  const results: ValidationResult[] = [];

  const addResult = (id: string, passed: boolean, level: ValidationResult['level'], message: string) => {
    results.push({ id, passed, level, message });
  };

  // 1. 通用检查
  addResult('has-title', !!structure.title, 'error', 
    structure.title ? '✔️ 已具备主标题' : '❌ 缺少主标题');

  addResult('has-body', structure.body.length > 0, 'error', 
    structure.body.length > 0 ? '✔️ 已具备正文内容' : '❌ 缺少正文内容');

  // 2. 根据不同公文类型的特殊校验
  if (structure.docType === '红头文件') {
    addResult('has-salutation', !!structure.salutation, 'warning', 
      structure.salutation ? '✔️ 主送机关已识别' : '⚠️ 未识别到主送机关');

    addResult('has-signoff-org', !!structure.signoff?.organization, 'error', 
      structure.signoff?.organization ? '✔️ 落款机关已识别' : '❌ 缺少落款机关');

    addResult('has-signoff-date', !!structure.signoff?.date, 'error', 
      structure.signoff?.date ? '✔️ 落款日期已识别' : '❌ 缺少落款日期');
  }

  // 工作表单和会议纪要大多需要从 MetadataForm 里面获取，所以会在 UI 层面上搭配 Metadata 表单一起校验

  return results;
}
