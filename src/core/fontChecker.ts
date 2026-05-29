import { BlockType, BodyBlock } from '../types/document';
import type { FontInfo } from './fontExtractor';

/**
 * 字体别名归一化表（统一为 PRD 规范字体名）
 * key: lowercase 无连字符的字体名
 * value: 规范名称
 */
const FONT_ALIASES: Record<string, string> = {
  'simhei':                  '黑体',
  'heitisc':                 '黑体',
  '黑体':                    '黑体',
  'kaiti':                   '楷体_GB2312',
  'kaiti_gb2312':            '楷体_GB2312',
  'stkaiti':                 '楷体_GB2312',
  '楷体':                    '楷体_GB2312',
  '楷体_gb2312':             '楷体_GB2312',
  'fangsong':                '仿宋_GB2312',
  'fangsong_gb2312':         '仿宋_GB2312',
  'stfangsong':              '仿宋_GB2312',
  '仿宋':                    '仿宋_GB2312',
  '仿宋_gb2312':             '仿宋_GB2312',
  'fzxiaobiaosongb05s':      '方正小标宋简体',
  'fzxiaobiaosongsr-gb':     '方正小标宋简体',
  '方正小标宋简体':            '方正小标宋简体',
  'simsun':                  '宋体',
  '宋体':                    '宋体',
  'timesnewroman':           'Times New Roman',
};

/** 规范字体映射（段落类型 → 期望字体） */
export const EXPECTED_FONTS: Partial<Record<BlockType, { eastAsia: string, ascii: string }>> = {
  title:       { eastAsia: '方正小标宋简体', ascii: 'Times New Roman' },
  h1:          { eastAsia: '黑体',          ascii: 'Times New Roman' },
  h2:          { eastAsia: '楷体_GB2312',   ascii: 'Times New Roman' },
  h3:          { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  h4:          { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  body:        { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  salutation:  { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  signoffOrg:  { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  signoffDate: { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
  attachment:  { eastAsia: '仿宋_GB2312',   ascii: 'Times New Roman' },
};

export interface FontIssue {
  axis: 'eastAsia' | 'ascii';
  expected: string;
  actual: string;
  message: string;
}

export interface FontCheckResult {
  compliant: boolean;
  issues: FontIssue[];
}

export interface FontReport {
  totalBlocks: number;
  nonCompliantCount: number;
  totalIssues: number;
  blocks: (BodyBlock & { fontCompliant: boolean; fontIssues: FontIssue[] })[];
}

/** 字体名称归一化：lowercase + 去非字母数字字符 → 查别名表 */
function normalizeFont(name: string): string {
  if (!name) return '';
  const key = name.toLowerCase().replace(/[\s\-_]/g, '');
  return FONT_ALIASES[key] ?? name;
}

/**
 * 检查单个段落的字体合规性
 */
export function checkBlockFont(blockType: BlockType, actualFont?: FontInfo | null): FontCheckResult {
  const expected = EXPECTED_FONTS[blockType];
  if (!expected || !actualFont) return { compliant: true, issues: [] };

  const issues: FontIssue[] = [];

  const actualEA = normalizeFont(actualFont.eastAsia);
  const actualAS = normalizeFont(actualFont.ascii);

  if (actualEA && actualEA !== expected.eastAsia) {
    issues.push({
      axis: 'eastAsia',
      expected: expected.eastAsia,
      actual: actualFont.eastAsia,
      message: `中文字体应为「${expected.eastAsia}」，实际为「${actualFont.eastAsia}」`,
    });
  }
  if (actualAS && actualAS !== expected.ascii) {
    issues.push({
      axis: 'ascii',
      expected: expected.ascii,
      actual: actualFont.ascii,
      message: `西文字体应为「${expected.ascii}」，实际为「${actualFont.ascii}」`,
    });
  }

  return { compliant: issues.length === 0, issues };
}

/**
 * 批量检查全文所有 BodyBlock 的字体合规性
 */
export function checkAllFonts(blocks: BodyBlock[]): FontReport {
  let totalIssues = 0;
  const results = blocks.map(block => {
    const { compliant, issues } = checkBlockFont(block.type, block.fontInfo);
    if (!compliant) totalIssues += issues.length;
    return { ...block, fontCompliant: compliant, fontIssues: issues };
  });

  return {
    totalBlocks: blocks.length,
    nonCompliantCount: results.filter(b => !b.fontCompliant).length,
    totalIssues,
    blocks: results,
  };
}
