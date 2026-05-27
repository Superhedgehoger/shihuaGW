import type { DocumentStructure, BodyBlock, DocType, BlockType } from '../types/document';
import { normalizeText, normalizeDate } from './preprocessor';

/**
 * 将原始文档通过正则和特征分析转化为结构化对象 DocumentStructure
 * 完全在本地浏览器离线运行
 *
 * 对应 VBA 逻辑：
 *   - GWStyle()：标题层级识别（一、二级标题、段落分类）
 *   - Title1()：主标题提取、主送机关识别
 *   - Inscribe()：落款/日期提取与规范化
 *
 * @param rawText 原始文本
 * @param docType 选择的公文类型
 * @returns 结构化的公文对象
 */
export function parseDocument(rawText: string, docType: DocType): DocumentStructure {
  const cleanedText = normalizeText(rawText);
  const lines = cleanedText.split('\n');

  const structure: DocumentStructure = {
    docType,
    title: '',
    body: []
  };

  if (lines.length === 0) return structure;

  // ── 辅助函数 ──
  let blockIdCounter = 1;
  const genId = () => `block_${String(blockIdCounter++).padStart(3, '0')}`;

  // ── 针对「其他」类型的空白模板处理（自适应扁平正文模式） ──
  if (docType === '其他') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      let type: BlockType = 'body';
      let isFlagged = false;

      // 依然允许并重整 1-5 级标题，方便排版自动重编号
      if (isH1(line)) {
        type = 'h1';
      } else if (isH2(line)) {
        type = 'h2';
        if (/^\([一二三四五六七八九十]+\)/.test(line)) isFlagged = true;
      } else if (isH3(line)) {
        type = 'h3';
        if (/^\d+[、]/.test(line)) isFlagged = true;
      } else if (isH4(line)) {
        type = 'h4';
        if (/^\(\d+\)/.test(line)) isFlagged = true;
      } else if (isH5(line)) {
        type = 'h5';
      }

      structure.body.push({
        id: genId(),
        type,
        text: line,
        flagged: isFlagged,
      });
    }
    return structure;
  }

  // ── 1. 首行提取为主标题 ──
  // 对应 VBA Title1() 中的 doc.Paragraphs(1).Range 处理
  structure.title = lines[0];
  let startIndex = 1;

  // 跳过草稿标注行（如"（草稿）"），对应 VBA Title1() 中 "（草稿）" 特殊处理
  if (startIndex < lines.length && /^（草稿|草稿）/.test(lines[startIndex])) {
    structure.title += `\n${lines[startIndex]}`;
    startIndex++;
  }

  // ── 2. 识别主送机关 ──
  // 对应 VBA Title1() 中：If .Text Like "*[：:]?" Then（检查称呼行）
  // 不仅限于红头文件，所有公文类型均可能有称呼
  if (startIndex < lines.length) {
    const secondLine = lines[startIndex];
    // 主送机关特征：以"："结尾，长度 ≤ 40字，不像正文段落（不以序号开头）
    const isSalutation =
      (secondLine.endsWith('：') || secondLine.endsWith(':')) &&
      secondLine.length <= 40 &&
      !/^[一二三四五六七八九十]、/.test(secondLine) &&
      !/^（[一二三四五六七八九十]）/.test(secondLine);
    if (isSalutation) {
      structure.salutation = secondLine.replace(/:$/, '：'); // 统一为全角冒号
      startIndex++;
    }
  }

  // ── 3. 全局扫描寻找落款和日期（倒序扫描最后5行）──
  // 对应 VBA Inscribe() 中的日期查找逻辑：
  //   .Text = "^13[0-9]{4}年[0-9]{1,2}月[0-9]{1,2}日[^13^12]"
  let signoffOrgIndex = -1;
  let signoffDateIndex = -1;

  const dateRegex = /^(\d{4})[年.-](\d{1,2})[月.-](\d{1,2})日?$/;
  // 扫描倒数 6 行寻找日期，对应 VBA 落款通常在结尾附近
  for (let j = lines.length - 1; j >= Math.max(0, lines.length - 6); j--) {
    const rawDate = lines[j];
    const normalizedDate = normalizeDate(rawDate);
    const match = normalizedDate.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (match) {
      signoffDateIndex = j;
      if (!structure.signoff) structure.signoff = { organization: '', date: '' };
      // 去掉前导零：对应 VBA Inscribe() 中 "If .Text Like "*0?月*" Then .Characters(6).Delete"
      structure.signoff.date = `${match[1]}年${parseInt(match[2])}月${parseInt(match[3])}日`;
      break;
    }
  }

  // 紧接在日期上方的行，很可能是落款机关
  // 对应 VBA Inscribe() 中 unit 部分：找到日期行之前不以标点结尾的短行
  if (signoffDateIndex !== -1 && signoffDateIndex > startIndex) {
    const potentialOrgLine = lines[signoffDateIndex - 1];
    // 落款机关特征：≤30字，不以常见正文结尾标点结尾，不是序号开头
    const isSignoffOrg =
      potentialOrgLine.length <= 30 &&
      !/[。！？；]$/.test(potentialOrgLine) &&
      !/^[一二三四五六七八九十]、/.test(potentialOrgLine) &&
      !/^（[一二三四五六七八九十]）/.test(potentialOrgLine);
    if (isSignoffOrg) {
      signoffOrgIndex = signoffDateIndex - 1;
      if (!structure.signoff) structure.signoff = { organization: '', date: '' };
      structure.signoff.organization = potentialOrgLine;
    }
  }

  // ── 4. 解析正文块、标题与附件 ──
  // 对应 VBA GWStyle() 中对各段落的 Like 模式匹配：
  //   "一、*"   → wdStyleHeading2（前端映射为 h1）
  //   "（一）*" → wdStyleHeading3（前端映射为 h2）
  //   "#．*"   → wdStyleHeading4（前端映射为 h3）
  //   "（#）*" → wdStyleHeading5（前端映射为 h4）
  //   "①②③*" → h5
  let inAttachmentSection = false;

  for (let i = startIndex; i < lines.length; i++) {
    // 跳过已提取的落款/日期行
    if (i === signoffOrgIndex || i === signoffDateIndex) continue;

    const line = lines[i];
    let type: BlockType = 'body';
    let isFlagged = false;

    if (inAttachmentSection) {
      // 已进入附件区域后的所有行都归为附件
      type = 'attachment';
      if (!structure.attachments) structure.attachments = [];
      structure.attachments.push(line);
    } else {
      // ── 标题层级识别（对应 VBA GWStyle() 的 For Each i In .Paragraphs 循环） ──

      if (isH1(line)) {
        // 一级标题："一、内容" 对应 VBA "一、*" Like 匹配 → wdStyleHeading2
        type = 'h1';
      } else if (isH2(line)) {
        // 二级标题："（一）内容" 对应 VBA "（一）*" Like 匹配 → wdStyleHeading3
        type = 'h2';
        // 半角括号标记需要修正（对应 VBA 前期的括号统一）
        if (/^\([一二三四五六七八九十]+\)/.test(line)) isFlagged = true;
      } else if (isH3(line)) {
        // 三级标题："1．内容" 对应 VBA "#．*" Like 匹配 → wdStyleHeading4
        type = 'h3';
        // 顿号替代点号是错误格式，需提醒
        if (/^\d+[、]/.test(line)) isFlagged = true;
      } else if (isH4(line)) {
        // 四级标题："（1）内容" 对应 VBA "（#）*" Like 匹配 → wdStyleHeading5
        type = 'h4';
        if (/^\(\d+\)/.test(line)) isFlagged = true; // 半角括号
      } else if (isH5(line)) {
        // 五级标题：带圈数字 ①②③
        type = 'h5';
      } else if (isAttachmentLine(line)) {
        // 附件标注："附件：xxx" 对应 VBA 中附件识别 ".Text Like "附件*""
        type = 'attachment';
        inAttachmentSection = true;
        // 半角冒号是不规范格式，标记提醒
        if (line.startsWith('附件:')) isFlagged = true;

        if (!structure.attachments) structure.attachments = [];
        const content = line.replace(/^附件[：:]\s*/, '').trim();
        if (content) structure.attachments.push(content);
      } else if (isCcLine(line)) {
        // 抄送行识别："抄送：xxx" 或 "抄报：xxx"
        if (!structure.cc) structure.cc = [];
        structure.cc.push(line);
      }
    }

    structure.body.push({
      id: genId(),
      type,
      text: line,
      flagged: isFlagged,
    });
  }

  return structure;
}

// ============================================================================
// 各段落类型识别函数（对应 VBA GWStyle() 中的 .Text Like "xxx" 判断）
// ============================================================================

/**
 * 一级标题：以中文序号 + 顿号开头（一、二、三、...）
 * 对应 VBA：If .Text Like "一、*"
 */
function isH1(line: string): boolean {
  return /^[一二三四五六七八九十百]+、/.test(line);
}

/**
 * 二级标题：以全角括号 + 中文序号 + 括号包裹（（一）（二）...）
 * 也兼容半角括号（会被标记为 flagged）
 * 对应 VBA：If .Text Like "（一）*"
 */
function isH2(line: string): boolean {
  return /^（[一二三四五六七八九十百]+）/.test(line) ||
         /^\([一二三四五六七八九十百]+\)/.test(line);
}

/**
 * 三级标题：以阿拉伯数字 + 句号/全角句号开头（1．2．...）
 * 也检测错误使用顿号的情况
 * 对应 VBA：If .Text Like "#．*"
 */
function isH3(line: string): boolean {
  return /^\d+[.．]/.test(line) ||
         /^\d+、/.test(line);
}

/**
 * 四级标题：以全角括号 + 阿拉伯数字 + 括号包裹（（1）（2）...）
 * 对应 VBA：If .Text Like "（#）*"
 */
function isH4(line: string): boolean {
  return /^（\d+）/.test(line) ||
         /^\(\d+\)/.test(line);
}

/**
 * 五级标题：以带圈数字开头（①②③④⑤...）
 * 对应 VBA 中的 Heading5 样式识别
 */
function isH5(line: string): boolean {
  return /^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/.test(line);
}

/**
 * 附件行识别
 * 对应 VBA：ElseIf .Text Like "[!^13]附件*" Or .Text Like "附件*"
 */
function isAttachmentLine(line: string): boolean {
  return /^附件[：:]/.test(line);
}

/**
 * 抄送/抄报行识别（版记部分）
 * 对应 VBA 对版记部分的处理（附注、抄送等）
 */
function isCcLine(line: string): boolean {
  return /^(抄送|抄报)[：:]/.test(line);
}
