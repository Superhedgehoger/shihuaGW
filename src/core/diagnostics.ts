import type { DocumentStructure, DiagnosticReport, DiagnosticIssue } from '../types/document';
import { checkBlockFont } from './fontChecker';

/**
 * 运行格式诊断（对应应用设计的 B 模式：格式诊断）
 * 查找标点、序号等常见容易出错的地方
 * 
 * @param structure 识别出的公文结构
 * @returns 诊断报告
 */
export function runDiagnostics(structure: DocumentStructure): DiagnosticReport {
  const issues: DiagnosticIssue[] = [];

  const addIssue = (type: DiagnosticIssue['type'], level: DiagnosticIssue['level'], message: string, example?: string) => {
    const existing = issues.find(i => i.type === type && i.message === message);
    if (existing) {
      if (example && existing.examples && !existing.examples.includes(example)) {
        existing.examples.push(example);
      }
    } else {
      issues.push({
        type,
        level,
        message,
        examples: example ? [example] : []
      });
    }
  };

  // 1. 结构化特征诊断
  if (!structure.title && structure.docType !== '其他') {
    addIssue('structure', 'error', '未识别到文档标题。请确保第一行不为空。');
  }

  if (structure.docType === '红头文件') {
    if (!structure.salutation) {
      addIssue('structure', 'warning', '红头文件未识别到主送机关。通常位于标题下方顶格，以冒号结尾。');
    }
    if (!structure.signoff?.date) {
      addIssue('structure', 'error', '未识别到落款日期。需采用如“2023年1月1日”的格式。');
    }
    if (!structure.signoff?.organization) {
      addIssue('structure', 'warning', '未识别到发文机关署名。通常位于日期上方。');
    }
  }

  // 2. 标点和内容特征诊断
  const halfPunctuationRegex = /([a-zA-Z0-9]?)([,\.;!?:()]+)([a-zA-Z0-9]?)/g;
  
  structure.body.forEach(block => {
    // 标记的（如半角括号导致的降级或语法错误）
    if (block.flagged) {
      addIssue('numbering', 'warning', '疑似序号符号误用（如多用了半角括号、点号和顿号混用等）。', block.text.substring(0, 15) + '...');
    }

    // 中文段落里混入的半角符号探测（简单的规则，连续纯英文/数字间的半角不报警）
    let match;
    while ((match = halfPunctuationRegex.exec(block.text)) !== null) {
      // 如果半角符号前后不是纯英文或数字，那就是中文里面混进了半角标点
      if (!match[1] && !match[3]) {
        addIssue('punctuation', 'warning', '中文语境中发现半角标点符号，建议修改为全角。', block.text.substring(Math.max(0, match.index - 5), match.index + 10));
      }
    }
    
    // 首行缩进探测：文本是否以两个全角空格（\u3000）开头？
    // 由于我们在 preprocessor 里面移除了前面的空白，实际渲染靠 CSS / Word 的 text-indent 属性完成。
    // 如果用户手动打了4个空格或者全角空格被清理了，这里并不作为错误，但如果想严格要求可以进一步判断原始文本。

    // 字体检测
    if (block.fontInfo) {
      const { compliant, issues: fontIssues } = checkBlockFont(block.type, block.fontInfo);
      if (!compliant) {
        fontIssues.forEach((issue) => {
          addIssue('font', 'error', issue.message, block.text.substring(0, 15) + '...');
        });
      }
    }
  });

  return {
    total: issues.length,
    hasErrors: issues.some(i => i.level === 'error'),
    issues
  };
}
