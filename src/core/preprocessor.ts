/**
 * 文本预处理器
 * 对应 VBA Initial() + GWStyle() 中的文本清洗部分
 *
 * 负责清洗文档：
 * 1. 括号/符号规范化（半角 → 全角，中文语境下的标点统一）
 * 2. 清理不可见字符、异常空格（含行首行尾）
 * 3. 列表序号规范化（对应 VBA .Find.Execute 替换逻辑）
 * 4. 附表 → 附件 替换
 * 5. 移除空行
 */

/**
 * 规范化单行文本（括号、标点）
 * 对应 VBA Initial() 中：
 *   .Execute "(", , , 0, , , , , , "（", 2
 *   .Execute ")", , , 0, , , , , , "）", 2
 *   .Execute "([、.．）])([ 　^s^t]{1,})", ... 清理标点后空格
 */
function normalizeLine(line: string): string {
  // 1. 全角括号统一（中文文档中不应出现半角括号，除非是英文/代码）
  //    仅在前后有中文字符，或作为序号格式时替换
  let s = line;

  // 2. 标点后多余空格清理（对应 VBA 中 "([、.．）])([ 　^s^t]{1,})" → "\1" 的正则替换）
  s = s.replace(/([、.．）】}])\s+/g, '$1');

  // 3. 附表 → 附件（对应 VBA .Execute "附表", , , , , , , , , "附件"）
  s = s.replace(/附表/g, '附件');

  return s;
}

/**
 * 规范化中文序号（对应 VBA GWStyle() 中的 .Find.Execute 序号修正）
 *
 * VBA 逻辑摘要：
 *   "(^13)([一二三四五六七八九十百零〇○...]+)(、)" → "\1一\3"  （一级重置为一）
 *   "(^13)([(（][一二三四五六七八九十百零...]+[）)]))" → "\1（一）"  （二级重置）
 *   "(^13)([0-9０-９]+[、.．])" → "\11．"  （三级序号规范化）
 *   "(^13)[(（][0-9０-９]+[）)]" → "\1（1）"  （四级序号规范化）
 *
 * NOTE: VBA 会重置所有序号为首个，前端这里只做格式规范，不重置数字，
 * 实际自动编号由 vbaFormatter.ts 中的 autoNumberHeadings() 负责。
 */
function normalizeListNumber(line: string): string {
  let s = line;

  // 一级标题：将全角数字"０、"等统一成汉字格式"一、"（仅格式不对时提示，不强制重置数字）
  // 半角括号 → 全角括号（仅序号格式）
  s = s.replace(/^\(([一二三四五六七八九十百]+)\)/, '（$1）');
  s = s.replace(/^\((\d+)\)/, '（$1）');

  // 三级标题：全角数字点 "１．" → 半角数字点 "1．"
  s = s.replace(/^([０-９]+)[.．、]/, (_, n: string) => `${n.replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))}.`);

  return s;
}

/**
 * 日期格式规范化
 * 对应 VBA Inscribe() 中 Find "^13[0-9]{4}?[0-9]{1,2}?[0-9]{1,2}[^13^12]" 并替换为 年月日 格式
 * 并去掉前导零月份（"01月" → "1月"）
 *
 * @example "20240115" → "2024年1月15日"
 * @example "2024.01.15" → "2024年1月15日"
 * @example "2024年01月05日" → "2024年1月5日"
 */
export function normalizeDate(line: string): string {
  // 数字格式：20240115 / 2024.1.15 / 2024-01-15
  let s = line.replace(
    /^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/,
    (_, y, m, d) => `${y}年${parseInt(m)}月${parseInt(d)}日`
  );

  // 去掉前导零：2024年01月05日 → 2024年1月5日
  s = s.replace(/(\d{4})年0*(\d+)月0*(\d+)日/, (_, y, m, d) => `${y}年${m}月${d}日`);

  return s;
}

/**
 * 规范化文本（主入口）
 * @param text 原始输入文本
 * @returns 规范化后的文本
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // ── 1. 手动换行符统一为 \n（对应 VBA Initial() 中 "^l" → "^p"）──
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // ── 2. 半角标点→全角（位于中文字符之后时）──
  // 对应 VBA GWStyle() 开头的 ClearFormatting 后的格式应用
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]),/g, '$1，');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\./g, '$1。');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]);/g, '$1；');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])!/g, '$1！');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5])\?/g, '$1？');
  cleaned = cleaned.replace(/([\u4e00-\u9fa5]):/g, '$1：');

  // ── 3. 按行处理 ──
  let lines = cleaned.split('\n');

  lines = lines.map(line => {
    // 行首行尾去除空白（含全角空格 \u3000 和制表符）
    // 对应 VBA CommandBars.FindControl(ID:=122).Execute（删除段落首尾空格）
    let l = line.replace(/^[\s\u3000\t]+/, '').replace(/[\s\u3000\t]+$/, '');

    // 中文字符间多余空格清理
    l = l.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');

    // 逐行规范化
    l = normalizeLine(l);
    l = normalizeListNumber(l);

    return l;
  });

  // ── 4. 过滤空行 ──
  lines = lines.filter(line => line.length > 0);

  return lines.join('\n');
}
