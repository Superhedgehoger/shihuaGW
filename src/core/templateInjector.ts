import PizZip from 'pizzip';
import type { DocumentStructure, MetadataForm } from '../types/document';
import type { TemplateConfig } from '../types/template';

// ============================================================================
// 辅助常量
// ============================================================================

/** 厘米转 EMU（English Metric Unit）：1cm = 360000 EMU */
const CM_TO_EMU = 360000;
/** 厘米转二十分之一磅（twip）：1cm ≈ 567.17 twip */
const CM_TO_TWIP = 567.17;
/** 磅转 twip：1pt = 20 twip */
const PT_TO_TWIP = 20;
/** 字符单位转 twip（仿宋三号16pt，一个字符约 = 16pt * 1.25 = 20pt = 400twip，近似值） */
const CHAR_TO_TWIP = 320;

// ============================================================================
// 样式映射：将公文段落类型映射到 Word 内置样式配置
// 对应 VBA StyleReset() 函数
// ============================================================================

interface WordParaStyle {
  /** 字体（中文） */
  fontCn: string;
  /** 字体（英文） */
  fontEn: string;
  /** 字号（半磅值，Word 内部单位，16pt → 320） */
  halfPt: number;
  /** 是否加粗 */
  bold: boolean;
  /** 对齐方式 */
  jc: 'left' | 'center' | 'right' | 'both';
  /** 固定行距（twip，0 = 自动） */
  lineSpaceTwip: number;
  /** 首行缩进（twip） */
  indentFirstTwip: number;
  /** 右缩进（twip，用于落款） */
  indentRightTwip?: number;
}

/**
 * 各段落类型的 Word 样式配置
 * 对应 VBA 中 GWStyle() + StyleReset() 的字体/段落设置
 * 三号字 = 16pt，二号字 = 22pt，小四号 = 12pt
 */
const PARA_STYLES: Record<string, WordParaStyle> = {
  // 主标题：方正小标宋简体，二号（22pt），居中，0缩进
  // 对应 VBA Title1() 中的设置
  title: {
    fontCn: '方正小标宋简体',
    fontEn: '方正小标宋简体',
    halfPt: 440,
    bold: false,
    jc: 'center',
    lineSpaceTwip: 540,  // 27pt * 20 = 540 twip
    indentFirstTwip: 0,
  },
  // 主送机关：仿宋，三号（16pt），左对齐，0缩进
  salutation: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: 0,
  },
  // 一级标题：黑体，三号（16pt），左对齐，2字缩进
  // 对应 VBA GWStyle() 中 "一、*" 分支：.Style = wdStyleHeading2，黑体
  h1: {
    fontCn: '黑体',
    fontEn: 'Arial',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  // 二级标题：楷体，三号（16pt），左对齐，2字缩进
  // 对应 VBA GWStyle() 中 "（一）*" 分支：楷体
  h2: {
    fontCn: '楷体',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  // 三级标题：仿宋，三号（16pt），左对齐，2字缩进
  // 对应 VBA GWStyle() 中 "#．*" 分支
  h3: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  // 四级标题：仿宋，三号（16pt），左对齐，2字缩进
  h4: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  h5: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  // 正文：仿宋，三号（16pt），两端对齐，2字缩进，27pt行距
  // 对应 VBA GWStyle() 中的正文格式设置
  body: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'both',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
  // 落款单位：仿宋，三号（16pt），右对齐，右缩进约6字
  // 对应 VBA Inscribe() 中落款单位的缩进计算
  signoffOrg: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'right',
    lineSpaceTwip: 540,
    indentFirstTwip: 0,
    indentRightTwip: CHAR_TO_TWIP * 4,
  },
  // 落款日期：仿宋，三号（16pt），右对齐，右缩进约5字
  signoffDate: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'right',
    lineSpaceTwip: 540,
    indentFirstTwip: 0,
    indentRightTwip: CHAR_TO_TWIP * 5,
  },
  // 附件：仿宋，三号，左对齐，2字缩进
  attachment: {
    fontCn: '仿宋',
    fontEn: 'Times New Roman',
    halfPt: 320,
    bold: false,
    jc: 'left',
    lineSpaceTwip: 540,
    indentFirstTwip: CHAR_TO_TWIP * 2,
  },
};

// ============================================================================
// 从头构建最小化合规 .docx
// ============================================================================

/**
 * 生成页面设置 XML（sectPr）
 * 对应 VBA PaperSetup()：A4，上下2.54cm，左右3.17cm（GB）/ 左2.8右2.6（Q/SH）
 * 页眉距离1.5cm，页脚距离1.75cm（对应 VBA 中 HeaderDistance/FooterDistance）
 */
function buildSectPrXml(cfg: TemplateConfig, totalPages: number): string {
  const topTwip    = Math.round(cfg.page.top    * CM_TO_TWIP);
  const bottomTwip = Math.round(cfg.page.bottom * CM_TO_TWIP);
  const leftTwip   = Math.round(cfg.page.left   * CM_TO_TWIP);
  const rightTwip  = Math.round(cfg.page.right  * CM_TO_TWIP);

  // 页眉/页脚与纸张边缘的距离，对应 VBA 中 HeaderDistance=1.5cm，FooterDistance=1.75cm
  const headerDistTwip = Math.round(1.5  * CM_TO_TWIP);
  const footerDistTwip = Math.round(1.75 * CM_TO_TWIP);

  // 注意：页脚引用 rId99，在 document.xml.rels 中需对应
  const footerRef = totalPages > 2
    ? '<w:footerReference w:type="default" r:id="rId99"/>'
    : '';

  return `
    <w:sectPr>
      ${footerRef}
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="${topTwip}" w:right="${rightTwip}" w:bottom="${bottomTwip}" w:left="${leftTwip}" w:header="${headerDistTwip}" w:footer="${footerDistTwip}" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:type="lines" w:linePitch="312"/>
      <w:pgNumType w:fmt="decimal"/>
    </w:sectPr>`.trim();
}

/**
 * 生成单个段落的 OOXML（<w:p>）
 * 对应 VBA GWStyle() 中对每个段落的格式应用
 */
function buildParagraphXml(text: string, styleKey: string): string {
  const s = PARA_STYLES[styleKey] ?? PARA_STYLES['body'];

  // 行距：固定值（exact）对应 VBA 中 wdLineSpaceExactly
  const lineRule = 'exact';

  // 首行缩进（仅正文和标题，标题/落款为0）
  const indentXml = (s.indentFirstTwip > 0 || (s.indentRightTwip ?? 0) > 0)
    ? `<w:ind w:firstLine="${s.indentFirstTwip}" w:right="${s.indentRightTwip ?? 0}"/>`
    : '';

  // 转义 XML 特殊字符并过滤非法控制字符
  const escaped = text
    .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // xml:space="preserve" 防止 Word 压缩空格
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="${s.jc}"/>
        <w:spacing w:line="${s.lineSpaceTwip}" w:lineRule="${lineRule}"/>
        ${indentXml}
        <w:rPr>
          <w:rFonts w:ascii="${s.fontEn}" w:hAnsi="${s.fontEn}" w:eastAsia="${s.fontCn}"/>
          <w:sz w:val="${s.halfPt}"/>
          <w:szCs w:val="${s.halfPt}"/>
          ${s.bold ? '<w:b/><w:bCs/>' : ''}
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="${s.fontEn}" w:hAnsi="${s.fontEn}" w:eastAsia="${s.fontCn}"/>
          <w:sz w:val="${s.halfPt}"/>
          <w:szCs w:val="${s.halfPt}"/>
          ${s.bold ? '<w:b/><w:bCs/>' : ''}
        </w:rPr>
        <w:t xml:space="preserve">${escaped}</w:t>
      </w:r>
    </w:p>`.trim();
}

/**
 * 生成页脚 XML 内容（footer1.xml）
 * 对应 VBA PageNumGW()：页码格式 "－ N －"，宋体14pt，居中
 * 使用全角连字符 "－"（U+FF0D），避免破折号导致 PDF 导出格式混乱
 *
 * NOTE: 此处使用 wdFieldPage 域代码（OOXML 中对应 <w:fldChar> + <w:instrText>PAGE</w:instrText>）
 */
function buildFooterXml(): string {
  // 14pt 字号 → 半磅值 280
  const sz = 280;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
       xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
       xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
       xmlns:mv="urn:schemas-microsoft-com:mac:vml"
       xmlns:o="urn:schemas-microsoft-com:office:office"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
       xmlns:v="urn:schemas-microsoft-com:vml"
       xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
       xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
       xmlns:w10="urn:schemas-microsoft-com:office:word"
       xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
       xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
       xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
       xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
       xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
       xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
  <w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:rPr>
        <w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/>
        <w:sz w:val="${sz}"/>
        <w:szCs w:val="${sz}"/>
      </w:rPr>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/>
        <w:sz w:val="${sz}"/>
        <w:szCs w:val="${sz}"/>
      </w:rPr>
      <w:t xml:space="preserve">－ </w:t>
    </w:r>
    <w:fldSimple w:instr=" PAGE \* MERGEFORMAT ">
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/>
          <w:sz w:val="${sz}"/>
          <w:szCs w:val="${sz}"/>
        </w:rPr>
        <w:t>1</w:t>
      </w:r>
    </w:fldSimple>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="宋体" w:hAnsi="宋体" w:eastAsia="宋体"/>
        <w:sz w:val="${sz}"/>
        <w:szCs w:val="${sz}"/>
      </w:rPr>
      <w:t xml:space="preserve"> －</w:t>
    </w:r>
  </w:p>
</w:ftr>`;
}

/**
 * 估算文档页数（简单按段落数估算，不精确，仅用于决定是否显示页码）
 * 对应 VBA PageNumGW() 中 ComputeStatistics(wdStatisticPages) > 2 的判断
 */
function estimatePageCount(structure: DocumentStructure): number {
  const totalBlocks = structure.body.length + 3; // title + salutation + signoff
  // 粗略：每页约20行
  return Math.ceil(totalBlocks / 20) || 1;
}

/**
 * 生成 [Content_Types].xml
 */
function buildContentTypes(hasFooter: boolean): string {
  const footerEntry = hasFooter
    ? '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>'
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  ${footerEntry}
</Types>`;
}

/**
 * 生成 _rels/.rels
 */
function buildRootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

/**
 * 生成 word/_rels/document.xml.rels
 * hasFooter 为 true 时添加页脚关系（rId99 对应 sectPr 中的引用）
 */
function buildDocumentRels(hasFooter: boolean): string {
  const footerRel = hasFooter
    ? '<Relationship Id="rId99" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>'
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  ${footerRel}
</Relationships>`;
}

/**
 * 生成 word/settings.xml（启用修订痕迹更新等基本设置）
 */
function buildSettings(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`;
}

/**
 * 生成 word/styles.xml（最小化样式定义，确保正文正确渲染）
 */
function buildStyles(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia"/>
        <w:sz w:val="320"/>
        <w:szCs w:val="320"/>
        <w:lang w:val="zh-CN"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="仿宋"/>
      <w:sz w:val="320"/>
      <w:szCs w:val="320"/>
    </w:rPr>
  </w:style>
</w:styles>`;
}

// ============================================================================
// 主入口
// ============================================================================

/**
 * 从零构建合规 .docx 文件（无模板依赖）
 * 对应 VBA 脚本中所有 Function 的综合输出
 *
 * 实现逻辑：
 * 1. 根据 DocumentStructure 按段落类型生成 OOXML <w:p> 节点
 * 2. 按 TemplateConfig 设置页边距（PaperSetup 等价）
 * 3. 按 VBA PageNumGW() 逻辑写入页码页脚（仅3页以上）
 * 4. 使用 PizZip 组装 .docx 包结构
 */
function buildDocxFromScratch(
  structure: DocumentStructure,
  _metadata: MetadataForm,
  templateConfig: TemplateConfig
): Blob {
  const totalPages = estimatePageCount(structure);
  // 仅超过2页才显示页码，对应 VBA PageNumGW 中的 ComputeStatistics > 2 判断
  const hasFooter = totalPages > 2;

  // ── 收集所有段落 XML ──
  const paraXmls: string[] = [];

  // 主标题
  if (structure.title) {
    paraXmls.push(buildParagraphXml(structure.title, 'title'));
  }

  // 主送机关
  if (structure.salutation) {
    paraXmls.push(buildParagraphXml(structure.salutation, 'salutation'));
  }

  // 正文块
  for (const block of structure.body) {
    let styleKey = 'body';
    if (block.type === 'h1') styleKey = 'h1';
    else if (block.type === 'h2') styleKey = 'h2';
    else if (block.type === 'h3') styleKey = 'h3';
    else if (block.type === 'h4') styleKey = 'h4';
    else if (block.type === 'h5') styleKey = 'h5';
    else if (block.type === 'attachment') styleKey = 'attachment';
    else if (block.type === 'signoffOrg') styleKey = 'signoffOrg';
    else if (block.type === 'signoffDate') styleKey = 'signoffDate';
    paraXmls.push(buildParagraphXml(block.text, styleKey));
  }

  // 落款
  if (structure.signoff) {
    if (structure.signoff.organization) {
      paraXmls.push(buildParagraphXml(structure.signoff.organization, 'signoffOrg'));
    }
    if (structure.signoff.date) {
      paraXmls.push(buildParagraphXml(structure.signoff.date, 'signoffDate'));
    }
  }

  // ── 构建 document.xml ──
  const sectPrXml = buildSectPrXml(templateConfig, totalPages);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
            xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
            xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
            xmlns:mv="urn:schemas-microsoft-com:mac:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
            xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
            xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
            xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
            xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
            mc:Ignorable="mv mo w14 wp14">
  <w:body>
    ${paraXmls.join('\n    ')}
    ${sectPrXml}
  </w:body>
</w:document>`;

  // ── 组装 PizZip 包 ──
  const encoder = new TextEncoder();
  const zip = new PizZip();
  zip.file('[Content_Types].xml', encoder.encode(buildContentTypes(hasFooter)), { binary: true });
  zip.file('_rels/.rels', encoder.encode(buildRootRels()), { binary: true });
  zip.file('word/document.xml', encoder.encode(documentXml), { binary: true });
  zip.file('word/styles.xml', encoder.encode(buildStyles()), { binary: true });
  zip.file('word/settings.xml', encoder.encode(buildSettings()), { binary: true });
  zip.file('word/_rels/document.xml.rels', encoder.encode(buildDocumentRels(hasFooter)), { binary: true });

  if (hasFooter) {
    zip.file('word/footer1.xml', encoder.encode(buildFooterXml()), { binary: true });
  }

  return zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

// ============================================================================
// 公开导出函数（带 Word 模板 fallback 逻辑）
// ============================================================================

/**
 * 将前端提取出的公文内容导出为 Word .docx 文件
 *
 * 策略：
 * 1. 优先尝试加载 /templates/{preset}/{docType}.docx（管理员预置的精细模板）
 * 2. 若文件不存在（HTTP 4xx / 网络错误），自动 fallback 到 buildDocxFromScratch()
 *    ── 即完全在浏览器内从零生成，无需任何服务端文件
 *
 * NOTE：页脚/页眉文件（footer*.xml、header*.xml）在 fallback 模式下由代码生成，
 * 不存在 VBA 版本中"页码域格式被重置为中文"的 Bug 风险。
 */
export async function exportDocx(
  structure: DocumentStructure,
  metadata: MetadataForm,
  templateConfig: TemplateConfig
): Promise<Blob> {
  // ── 尝试加载预置 Word 模板 ──
  const preset = templateConfig.wordTemplatePreset === 'none' ? 'gb' : templateConfig.wordTemplatePreset;
  const tplUrl = `/templates/${preset}/${structure.docType}.docx`;

  try {
    const response = await fetch(tplUrl);
    if (response.ok) {
      // 模板文件存在：走注入路径（Hybrid Template Injection）
      return await injectIntoTemplate(response, structure, metadata, templateConfig);
    }
    // HTTP 错误（404 等）→ fallback
    console.info(`[exportDocx] 模板文件未找到 (${tplUrl})，已自动切换为从头生成模式。`);
  } catch {
    // 网络错误（CORS / 文件不存在等）→ fallback
    console.info(`[exportDocx] 无法请求模板文件 (${tplUrl})，已自动切换为从头生成模式。`);
  }

  // ── Fallback：从头构建 ──
  return buildDocxFromScratch(structure, metadata, templateConfig);
}

// ============================================================================
// 模板注入路径（原有逻辑，保留不变）
// ============================================================================

/**
 * 将 DocumentStructure 注入已有的 Word 模板文件
 *
 * NOTE：页脚/页眉文件（footer*.xml、header*.xml）一律原样保留，
 * 不做任何修改，以避免页码域代码格式被破坏（VBA 版本中 — N — 变成 （N）N（N） 的 bug 根因）。
 */
async function injectIntoTemplate(
  response: Response,
  structure: DocumentStructure,
  _metadata: MetadataForm,
  templateConfig: TemplateConfig
): Promise<Blob> {
  const arrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(arrayBuffer);

  const docXmlBytes = zip.file('word/document.xml')?.asUint8Array();
  const docXmlString = docXmlBytes ? new TextDecoder('utf-8').decode(docXmlBytes) : '';
  if (!docXmlString) {
    throw new Error('Word 模板似乎已损坏或为空，未找到 word/document.xml');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlString, 'text/xml');
  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) throw new Error('无法在模板中定位到 <w:body>');

  // ── 页码 Bug 防御（见原有注释） ──
  const sectPrList = xmlDoc.getElementsByTagName('w:sectPr');
  if (sectPrList.length > 0) {
    const sectPr = sectPrList[sectPrList.length - 1];
    const pgNumType = sectPr.getElementsByTagName('w:pgNumType')[0];
    if (pgNumType) {
      const fmt = pgNumType.getAttribute('w:fmt');
      const chineseFmts = ['chineseCounting', 'chineseCountingThousand', 'chineseLegalSimplified'];
      if (fmt && chineseFmts.includes(fmt)) {
        console.warn(`[templateInjector] 检测到页码格式为中文格式 (${fmt})，已自动纠正为 decimal。`);
        pgNumType.setAttribute('w:fmt', 'decimal');
      }
    }
  }

  // ── 生成段落节点（使用 PARA_STYLES 而非硬编码 GW_* 样式名） ──
  const createParagraph = (text: string, styleKey: string): Element => {
    const s = PARA_STYLES[styleKey] ?? PARA_STYLES['body'];
    const escaped = text
      .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const tempDoc = parser.parseFromString(
      `<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:pPr>
          <w:jc w:val="${s.jc}"/>
          <w:spacing w:line="${s.lineSpaceTwip}" w:lineRule="exact"/>
          <w:ind w:firstLine="${s.indentFirstTwip}" w:right="${s.indentRightTwip ?? 0}"/>
          <w:rPr>
            <w:rFonts w:ascii="${s.fontEn}" w:hAnsi="${s.fontEn}" w:eastAsia="${s.fontCn}"/>
            <w:sz w:val="${s.halfPt}"/>
            <w:szCs w:val="${s.halfPt}"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="${s.fontEn}" w:hAnsi="${s.fontEn}" w:eastAsia="${s.fontCn}"/>
            <w:sz w:val="${s.halfPt}"/>
            <w:szCs w:val="${s.halfPt}"/>
          </w:rPr>
          <w:t xml:space="preserve">${escaped}</w:t>
        </w:r>
      </w:p>`,
      'text/xml'
    );
    return xmlDoc.importNode(tempDoc.documentElement, true);
  };

  const fragments: Element[] = [];
  if (structure.title) fragments.push(createParagraph(structure.title, 'title'));
  if (structure.salutation) fragments.push(createParagraph(structure.salutation, 'salutation'));
  for (const block of structure.body) {
    let styleKey = 'body';
    if (block.type === 'h1') styleKey = 'h1';
    else if (block.type === 'h2') styleKey = 'h2';
    else if (block.type === 'h3') styleKey = 'h3';
    else if (block.type === 'h4') styleKey = 'h4';
    else if (block.type === 'h5') styleKey = 'h5';
    else if (block.type === 'attachment') styleKey = 'attachment';
    fragments.push(createParagraph(block.text, styleKey));
  }
  if (structure.signoff) {
    if (structure.signoff.organization) fragments.push(createParagraph(structure.signoff.organization, 'signoffOrg'));
    if (structure.signoff.date) fragments.push(createParagraph(structure.signoff.date, 'signoffDate'));
  }

  // ── 找占位符或追加到尾部 ──
  const texts = xmlDoc.getElementsByTagName('w:t');
  let targetP: Element | null = null;
  for (let i = 0; i < texts.length; i++) {
    if (texts[i].textContent?.includes('{{BODY_PLACEHOLDER}}')) {
      let parent = texts[i].parentNode;
      while (parent && parent.nodeName !== 'w:p') parent = parent.parentNode;
      targetP = parent as Element;
      break;
    }
  }

  if (targetP?.parentNode) {
    for (const frag of fragments) targetP.parentNode.insertBefore(frag, targetP);
    targetP.parentNode.removeChild(targetP);
  } else {
    const sectPr = xmlDoc.getElementsByTagName('w:sectPr')[0];
    for (const frag of fragments) {
      sectPr ? body.insertBefore(frag, sectPr) : body.appendChild(frag);
    }
  }

  const serializer = new XMLSerializer();
  let modifiedXml = serializer.serializeToString(xmlDoc);
  modifiedXml = modifiedXml.replace(/ xmlns=""/g, '');
  const encoder = new TextEncoder();
  zip.file('word/document.xml', encoder.encode(modifiedXml), { binary: true });

  return zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });
}

// 兼容性导出（templateConfig 参数可能在旧调用中不传）
export { buildDocxFromScratch };
// 单位常量导出，供单元测试使用
export { CM_TO_TWIP, PT_TO_TWIP, CHAR_TO_TWIP };
