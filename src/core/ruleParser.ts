import type { DocumentStructure, BodyBlock, DocType, BlockType } from '../types/document';
import { normalizeText } from './preprocessor';

/**
 * 将原始文档通过正则和特征分析转化为结构化对象 DocumentStructure 
 * 这个规则引擎完全在本地浏览器离线运行，替代以前的大模型方案
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

  // 1. 首行提取为主标题
  structure.title = lines[0];
  let startIndex = 1;

  // 2. 识别主送机关 (红头文件常见，通常以“：”或“:”结尾且较短)
  if (docType === '红头文件' && startIndex < lines.length) {
    const secondLine = lines[startIndex];
    if (secondLine.endsWith('：') || secondLine.endsWith(':')) {
      structure.salutation = secondLine.replace(':', '：'); // 统一变全角冒号
      startIndex++;
    }
  }

  // 辅助函数：生成递增 ID
  let blockIdCounter = 1;
  const genId = () => `block_${String(blockIdCounter++).padStart(3, '0')}`;

  // 3. 全局扫描寻找落款和日期（通常在最后几行）
  let signoffOrgIndex = -1;
  let signoffDateIndex = -1;

  // 倒序匹配日期：2024年1月15日，或是不规范的 2024.1.15
  for (let j = lines.length - 1; j >= Math.max(0, lines.length - 5); j--) {
    const line = lines[j];
    const dateRegex = /^(\d{4})[年.-](\d{1,2})[月.-](\d{1,2})日?$/;
    if (dateRegex.test(line)) {
      signoffDateIndex = j;
      // 规范化日期格式
      const match = line.match(dateRegex);
      if (match) {
        if (!structure.signoff) structure.signoff = { organization: '', date: '' };
        structure.signoff.date = `${match[1]}年${match[2]}月${match[3]}日`;
      }
      break;
    }
  }
  
  // 紧接着日期上面那行很可能是落款机关
  if (signoffDateIndex !== -1 && signoffDateIndex > startIndex) {
    const potentialOrgLine = lines[signoffDateIndex - 1];
    // 排除上面是正文的可能性（简单以长度判断，比如落款机构通常小于30字）
    if (potentialOrgLine.length <= 30 && !/^[一二三四五六七八九十]/.test(potentialOrgLine)) {
      signoffOrgIndex = signoffDateIndex - 1;
      if (!structure.signoff) structure.signoff = { organization: '', date: '' };
      structure.signoff.organization = potentialOrgLine;
    }
  }

  // 4. 解析正文块与附件
  let inAttachmentSection = false;

  for (let i = startIndex; i < lines.length; i++) {
    // 如果当前行是落款或日期，跳过，因为上面已提取
    if (i === signoffOrgIndex || i === signoffDateIndex) {
      continue;
    }

    const line = lines[i];
    let type: BlockType = 'body';
    let isFlagged = false;

    // 如果已经在附件区域之下，通常剩下的也是附件内容或者版记附注
    if (inAttachmentSection) {
      type = 'attachment';
      if (!structure.attachments) structure.attachments = [];
      structure.attachments.push(line);
    } else {
      // 结构分类规则引擎（基于常见公文排版规范）
      if (/^[一二三四五六七八九十]+、/.test(line)) {
        type = 'h1';
      } else if (/^（[一二三四五六七八九十]+）/.test(line) || /^\([一二三四五六七八九十]+\)/.test(line)) {
        // 如果手误写成半角括号，规则引擎应当能够识别并标记
        type = 'h2';
        if (/^\([一二三四五六七八九十]+\)/.test(line)) isFlagged = true; // 半角括号需提示修正
      } else if (/^\d+[\.．、]/.test(line)) {
        type = 'h3';
        if (/^\d+[、]/.test(line)) isFlagged = true; // 三级应当是点，用了顿号，做提醒
      } else if (/^（\d+）/.test(line) || /^\(\d+\)/.test(line)) {
        type = 'h4';
        if (/^\(\d+\)/.test(line)) isFlagged = true;
      } else if (/^[①②③④⑤⑥⑦⑧⑨⑩]/.test(line)) {
        type = 'h5';
      } else if (line.startsWith('附件：') || line.startsWith('附件:')) {
        type = 'attachment';
        inAttachmentSection = true;
        isFlagged = line.startsWith('附件:'); // 半角冒号提醒
        
        if (!structure.attachments) structure.attachments = [];
        // 处理同一行附带内容，如“附件：1. 管理办法”
        const content = line.substring(3).trim();
        if (content) {
          structure.attachments.push(content);
        }
      }
    }

    structure.body.push({
      id: genId(),
      type: type,
      text: line,
      flagged: isFlagged
    });
  }

  return structure;
}
