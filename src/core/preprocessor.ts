/**
 * 文本预处理器
 * 负责清洗文档：
 * 1. 标点符号规范化（中文字符间的半角标点转全角）。
 * 2. 清理不可见字符、异常空格。
 * 3. 移除空行。
 */

/**
 * 规范化文本
 * @param text 原始输入文本
 * @returns 规范化后的文本
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 1. 将半角逗号、句号、冒号、分号、叹号、问号等转为全角
  // 匹配规则：当这些半角符号位于中文字符之后时，替换为全角
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]),/g, '$1，');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\./g, '$1。');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]);/g, '$1；');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])!/g, '$1！');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\?/g, '$1？');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]):/g, '$1：');

  // 将 [ ] 替换为 【 】（如果是在中文语境中，可以全局替换或根据特征）
  // 按照公文规范，一般附件等使用【】，这里为了安全起见，只对部分情况替换，或者在 ruleParser 中精细处理
  
  // 2. 清理中文字符之间的多余空格
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');

  // 3. 按行分割，去除行首行尾的各类空白字符（包括全角空格 \u3000）
  let lines = cleaned.split(/\r?\n/);
  lines = lines.map(line => line.replace(/^[\s\u3000]+/, '').replace(/[\s\u3000]+$/, ''));
  
  // 4. 过滤空行
  lines = lines.filter(line => line.length > 0);

  return lines.join('\n');
}
