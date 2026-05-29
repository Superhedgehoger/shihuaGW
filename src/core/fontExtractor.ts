import PizZip from 'pizzip';

export interface FontInfo {
  eastAsia: string;
  ascii: string;
  source?: 'style' | 'direct';
}

export interface FontMapItem extends FontInfo {
  pStyleId: string;
}

/**
 * 从 .docx ArrayBuffer 中提取各段落实际字体信息
 * @param arrayBuffer .docx 文件的 ArrayBuffer
 * @returns 与段落顺序对应的字体信息数组
 */
export function extractFonts(arrayBuffer: ArrayBuffer): FontMapItem[] {
  const zip = new PizZip(arrayBuffer);

  // 1. 解析 styles.xml：建立样式名 → 字体的映射
  const stylesXml = zip.file('word/styles.xml')?.asText() ?? '';
  const stylesFontMap = parseStylesFonts(stylesXml);

  // 2. 解析 document.xml：逐段落提取字体
  const docXml = zip.file('word/document.xml')?.asText() ?? '';
  return parseDocumentFonts(docXml, stylesFontMap);
}

/**
 * 解析 styles.xml，返回 styleName → {eastAsia, ascii} 映射
 */
function parseStylesFonts(xml: string): Record<string, FontInfo> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const map: Record<string, FontInfo> = {};
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

  doc.querySelectorAll('style').forEach(style => {
    const styleId = style.getAttributeNS(W, 'styleId') 
                 ?? style.getAttribute('w:styleId') ?? '';
    const rFonts = style.querySelector('rFonts') 
               ?? style.querySelector('[local-name="rFonts"]');
    if (rFonts && styleId) {
      map[styleId] = {
        eastAsia: rFonts.getAttributeNS(W, 'eastAsia') 
               ?? rFonts.getAttribute('w:eastAsia') ?? '',
        ascii:    rFonts.getAttributeNS(W, 'ascii') 
               ?? rFonts.getAttribute('w:ascii') ?? '',
      };
    }
  });
  return map;
}

/**
 * 解析 document.xml，逐段落提取字体
 * 优先取 run 级直接字体；若无则回退到段落样式字体；若无则记为空字符串
 */
function parseDocumentFonts(xml: string, stylesFontMap: Record<string, FontInfo>): FontMapItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const result: FontMapItem[] = [];

  const paragraphs = doc.querySelectorAll('[local-name="p"]');
  paragraphs.forEach(p => {
    // 过滤掉完全空白的段落，以匹配 mammoth 的行为
    // 为简单起见，按 PRD 要求：“在 fontExtractor.js 的输出中，同步跳过全空文本段落”
    const textContent = p.textContent || '';
    if (!textContent.trim()) {
      return;
    }

    // 取段落样式
    const pStyleEl = p.querySelector('[local-name="pStyle"]');
    const pStyleId = pStyleEl?.getAttributeNS(W, 'val') 
                  ?? pStyleEl?.getAttribute('w:val') ?? '';
    const styleFont = stylesFontMap[pStyleId] ?? { eastAsia: '', ascii: '' };

    // 取第一个有字体信息的 run
    let runFont: FontInfo = { eastAsia: '', ascii: '', source: 'style' };
    const runs = p.querySelectorAll('[local-name="r"]');
    for (const run of Array.from(runs)) {
      const rFonts = run.querySelector('[local-name="rFonts"]');
      if (rFonts) {
        const ea = rFonts.getAttributeNS(W, 'eastAsia') 
                ?? rFonts.getAttribute('w:eastAsia') ?? '';
        const as = rFonts.getAttributeNS(W, 'ascii') 
                ?? rFonts.getAttribute('w:ascii') ?? '';
        if (ea || as) {
          runFont = { eastAsia: ea, ascii: as, source: 'direct' };
          break;
        }
      }
    }

    result.push({
      pStyleId,
      eastAsia: runFont.eastAsia || styleFont.eastAsia,
      ascii:    runFont.ascii    || styleFont.ascii,
      source:   runFont.source,
    });
  });

  return result;
}
