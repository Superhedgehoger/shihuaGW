/**
 * vbaFormatter.ts
 * 公文排版格式化引擎（文本层面）
 *
 * 对应 VBA xkonglong_自动排版() 中的核心处理 Function：
 *   - GWStyle()：标题自动编号、格式统一
 *   - Title1()：主标题括号/空格处理
 *   - Inscribe()：落款机关+日期规范、附件编号
 *   - Common()：颜色恢复（前端无需实现）/ 清理
 *
 * NOTE: 此模块只做「文本结构」变换，不涉及字体/颜色（由 templateInjector 负责）
 */

import type { DocumentStructure, BodyBlock } from '../types/document';

// ── 中文数字表 ──
const CN_NUMS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

/**
 * 数字 → 中文序号（1 → 一，2 → 二，...20 → 二十）
 * 对应 VBA 中 CHINESENUM3 域格式
 */
function toChinese(n: number): string {
  return CN_NUMS[n] ?? String(n);
}

// ============================================================================
// 1. 主标题规范化
// 对应 VBA Title1() 函数
// ============================================================================

/**
 * 规范化主标题
 * - 统一括号为全角
 * - 删除末尾多余标点（对应 VBA Title1() 末尾标点删除逻辑）
 * - 删除标题内多余空格（对应 VBA Title1() 中 "[ 　^s^t]" → "" 替换）
 * - 如果标题两端不对称（如以"》"结尾但不以"《"开头），做处理
 */
export function normalizeTitle(title: string): string {
  let s = title;

  // 括号统一
  s = s.replace(/\(/g, '（').replace(/\)/g, '）');

  // 删除末尾多余标点（对应 VBA Title1 中：If .Text Like "*[。：；，、！？…—.:;,!?]?" 则删除最后字符）
  s = s.replace(/[。：；，、！？…—.;,!?]+$/, '');

  // 标题内多余空格（对应 VBA Title1 中 .Execute "[ 　^s^t]", , , 1, , , , , , "", 2）
  s = s.replace(/\s+/g, '');

  return s;
}

// ============================================================================
// 2. 标题自动重编号
// 对应 VBA GWStyle() 中对各级标题的 t2/t3/t4/t5 计数器逻辑
// ============================================================================

/**
 * 自动重编号正文块中的各级标题
 * 规则：
 *   h1：一、二、三…（中文序号 + 顿号，对应 VBA t2 计数器 + CHINESENUM3 域）
 *   h2：（一）（二）（三）…（对应 VBA t3 计数器 + CHINESENUM3 域）
 *   h3：1．2．3．…（阿拉伯数字 + 全角句号，对应 VBA t4 计数器）
 *   h4：（1）（2）（3）…（对应 VBA t5 计数器）
 *   h5：①②③…（圆圈数字，不自动计数，原样保留）
 *
 * NOTE: 遇到附件标注（"附件："），重置所有计数器，
 * 对应 VBA GWStyle() 中 ".Text Like "[!^13]附件*"" 分支重置 t2/t3/t4/t5
 */
export function autoNumberHeadings(body: BodyBlock[]): BodyBlock[] {
  let t1 = 0; // 一级标题计数
  let t2 = 0; // 二级标题计数
  let t3 = 0; // 三级标题计数
  let t4 = 0; // 四级标题计数

  return body.map(block => {
    // 遇到附件重置计数器
    if (block.type === 'attachment') {
      t1 = 0; t2 = 0; t3 = 0; t4 = 0;
      return block;
    }

    if (block.type === 'h1') {
      t1++;
      t2 = 0; t3 = 0; t4 = 0;
      // 提取标题内容（去掉原有序号）
      const content = stripH1Prefix(block.text);
      return { ...block, text: `${toChinese(t1)}、${content}` };
    }

    if (block.type === 'h2') {
      t2++;
      t3 = 0; t4 = 0;
      const content = stripH2Prefix(block.text);
      return { ...block, text: `（${toChinese(t2)}）${content}` };
    }

    if (block.type === 'h3') {
      t3++;
      t4 = 0;
      const content = stripH3Prefix(block.text);
      return { ...block, text: `${t3}．${content}` };
    }

    if (block.type === 'h4') {
      t4++;
      const content = stripH4Prefix(block.text);
      return { ...block, text: `（${t4}）${content}` };
    }

    return block;
  });
}

// ── 辅助：去掉各级标题的序号前缀 ──

/** 去掉 "一、" / "二、" 等前缀，保留后面的内容 */
function stripH1Prefix(text: string): string {
  return text.replace(/^[一二三四五六七八九十百]+[、．.]\s*/, '').trim();
}

/** 去掉 "（一）" / "（二）" 等前缀 */
function stripH2Prefix(text: string): string {
  return text.replace(/^[（(][一二三四五六七八九十百]+[）)]\s*/, '').trim();
}

/** 去掉 "1．" / "2." 等前缀 */
function stripH3Prefix(text: string): string {
  return text.replace(/^\d+[.．、]\s*/, '').trim();
}

/** 去掉 "（1）" / "(1)" 等前缀 */
function stripH4Prefix(text: string): string {
  return text.replace(/^[（(]\d+[）)]\s*/, '').trim();
}

// ============================================================================
// 3. 落款规范化
// 对应 VBA Inscribe() 函数
// ============================================================================

/**
 * 落款规范化：对日期和落款机关做标准处理
 *
 * VBA Inscribe() 处理内容（前端只做文本层面）：
 *   1. 日期格式规范（已在 preprocessor.normalizeDate 处理）
 *   2. 去掉月份/日期前导零（已在 ruleParser 处理）
 *   3. 落款机关字间距调整（前端不做，由 Word 样式控制）
 *   4. 附件编号与列表格式化
 */
export function normalizeInscribe(structure: DocumentStructure): DocumentStructure {
  // 日期已在 ruleParser 中规范化，此处仅做附加处理
  if (!structure.signoff) return structure;

  const { date } = structure.signoff;
  if (!date) return structure;

  // 去掉前导零（防止 ruleParser 遗漏的情况）
  const normalizedDate = date
    .replace(/年0+(\d)月/, '年$1月')
    .replace(/月0+(\d)日/, '月$1日');

  return {
    ...structure,
    signoff: {
      ...structure.signoff,
      date: normalizedDate,
    }
  };
}

// ============================================================================
// 4. 附件列表规范化
// 对应 VBA Inscribe() 后半段的附件编号与格式化
// ============================================================================

/**
 * 规范化附件列表
 * VBA 逻辑：
 *   - 单附件：直接 "附件：xxx"
 *   - 多附件：附件1：xxx \n 附件2：xxx
 *   - 清理附件名称前后的多余字符（《》、#号、数字序号等）
 */
export function normalizeAttachments(structure: DocumentStructure): DocumentStructure {
  if (!structure.attachments || structure.attachments.length === 0) return structure;

  const cleaned = structure.attachments.map(att => {
    let s = att;
    // 去掉书名号（对应 VBA Inscribe() 中 "If .Text Like "《*" Then .Characters(1).Delete"）
    s = s.replace(/^《|》$/g, '');
    // 去掉开头的数字序号（1. 1、 等）
    s = s.replace(/^\d+[.．、]\s*/, '');
    // 去掉开头的中文序号（一、 等）
    s = s.replace(/^[一二三四五六七八九十]+[、.．]\s*/, '');
    // 去掉 "附件" 前缀（如已包含）
    s = s.replace(/^附件\d*[：:]\s*/, '');
    return s.trim();
  }).filter(s => s.length > 0);

  return { ...structure, attachments: cleaned };
}

// ============================================================================
// 5. 三级标题末尾句号处理
// 对应 VBA GWStyle() 中 Heading4/5 末尾需要句号的规则：
//   "If .Text Like "*[!0-9a-zA-Z]?" Then .Characters.Last.InsertBefore Text:="。""
// ============================================================================

/**
 * 确保三/四级标题正文末尾有句号
 * VBA 规则：三级（h3）、四级（h4）标题正文部分如果末尾不是标点，补充句号
 */
export function ensureHeadingPunctuation(body: BodyBlock[]): BodyBlock[] {
  return body.map(block => {
    if (block.type !== 'h3' && block.type !== 'h4') return block;

    const text = block.text;
    // 检查末尾是否已有标点
    if (/[。！？；…—]$/.test(text)) return block;
    // 如果末尾是字母/数字，不加句号（对应 VBA "If .Text Like "*[!0-9a-zA-Z]?" Then"）
    if (/[0-9a-zA-Z]$/.test(text)) return block;

    return { ...block, text: text + '。' };
  });
}

// ============================================================================
// 6. 主入口：对 DocumentStructure 应用全部格式化规则
// ============================================================================

/**
 * 对已解析的文档结构应用 VBA 等效的排版规则
 * 在 parseDocument() 之后、预览/导出之前调用
 *
 * 执行顺序对应 VBA xkonglong_自动排版() 中各 Function 的调用顺序：
 *   1. normalizeTitle()   ← Title1()
 *   2. autoNumberHeadings() ← GWStyle() t2/t3/t4/t5 逻辑
 *   3. ensureHeadingPunctuation() ← GWStyle() 标题末尾标点规则
 *   4. normalizeAttachments() ← Inscribe() 附件部分
 *   5. normalizeInscribe()    ← Inscribe() 日期部分
 */
export function applyVbaFormatting(structure: DocumentStructure): DocumentStructure {
  let result = { ...structure };

  // 1. 主标题规范化
  result.title = normalizeTitle(result.title);

  // 2. 标题自动重编号
  result.body = autoNumberHeadings(result.body);

  // 3. 三/四级标题末尾句号
  result.body = ensureHeadingPunctuation(result.body);

  // 4. 附件列表规范化
  result = normalizeAttachments(result);

  // 5. 落款日期规范化
  result = normalizeInscribe(result);

  return result;
}
