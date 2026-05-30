import type { BlockType } from '../types/document';
import qshRulesJson from '../rules/qsh-rules.json';
import gbRulesJson from '../rules/gb-rules.json';

// ============================================================================
// 规则类型定义
// ============================================================================

/** 公文标准规则包 */
export interface DocRules {
  /** 标准代号 */
  standard: string;
  /** 标准名称 */
  name: string;
  /** 标题层级正则模式（字符串形式，需运行时编译） */
  headingPatterns: {
    h1: string;
    h2_full: string;
    h2_half: string;
    h3_dot: string;
    h3_dun: string;
    h4_full: string;
    h4_half: string;
    h5: string;
  };
  /** 主送机关识别规则 */
  salutation: {
    maxLength: number;
    endsWith: string[];
    excludePatterns: string[];
  };
  /** 落款识别规则 */
  signoff: {
    datePattern: string;
    scanLastLines: number;
    orgMaxLength: number;
    orgExcludeEnds: string[];
    orgExcludeStarts: string[];
  };
  /** 附件行识别 */
  attachment: { pattern: string };
  /** 抄送行识别 */
  cc: { pattern: string };
  /** 需要严格结构校验的公文类型 */
  strictDocTypes: string[];
  /** 各段落类型的期望字体 */
  expectedFonts: Partial<Record<string, { eastAsia: string; ascii: string }>>;
}

// ============================================================================
// 规则缓存（避免重复编译正则）
// ============================================================================

/** 编译后的正则缓存 */
export interface CompiledPatterns {
  h1: RegExp;
  h2Full: RegExp;
  h2Half: RegExp;
  h3Dot: RegExp;
  h3Dun: RegExp;
  h4Full: RegExp;
  h4Half: RegExp;
  h5: RegExp;
  attachment: RegExp;
  cc: RegExp;
  signoffDate: RegExp;
}

const compiledCache = new Map<string, CompiledPatterns>();

/**
 * 编译规则包中的正则字符串为 RegExp 对象，带缓存
 */
export function compilePatterns(rules: DocRules): CompiledPatterns {
  const cached = compiledCache.get(rules.standard);
  if (cached) return cached;

  const compiled: CompiledPatterns = {
    h1: new RegExp(rules.headingPatterns.h1),
    h2Full: new RegExp(rules.headingPatterns.h2_full),
    h2Half: new RegExp(rules.headingPatterns.h2_half),
    h3Dot: new RegExp(rules.headingPatterns.h3_dot),
    h3Dun: new RegExp(rules.headingPatterns.h3_dun),
    h4Full: new RegExp(rules.headingPatterns.h4_full),
    h4Half: new RegExp(rules.headingPatterns.h4_half),
    h5: new RegExp(rules.headingPatterns.h5),
    attachment: new RegExp(rules.attachment.pattern),
    cc: new RegExp(rules.cc.pattern),
    signoffDate: new RegExp(rules.signoff.datePattern),
  };

  compiledCache.set(rules.standard, compiled);
  return compiled;
}

// ============================================================================
// 规则加载 API
// ============================================================================

/** 内置规则包注册表 */
const RULES_REGISTRY: Record<string, DocRules> = {
  qsh: qshRulesJson as DocRules,
  gb: gbRulesJson as DocRules,
};

/**
 * 根据模板预设 ID 加载对应的规则包
 *
 * @param preset 模板的 wordTemplatePreset（'qsh' | 'gb' | 'none'）
 * @returns 对应的规则包（默认返回石化标准）
 */
export function loadRules(preset: string = 'qsh'): DocRules {
  if (preset === 'none') return RULES_REGISTRY['gb'];
  return RULES_REGISTRY[preset] ?? RULES_REGISTRY['qsh'];
}

/**
 * 获取指定标准的期望字体映射
 *
 * @param preset 模板预设
 * @param blockType 段落类型
 */
export function getExpectedFont(preset: string, blockType: BlockType | string): { eastAsia: string; ascii: string } | undefined {
  const rules = loadRules(preset);
  return rules.expectedFonts[blockType] as { eastAsia: string; ascii: string } | undefined;
}

/**
 * 获取指定标准的严格公文类型列表
 */
export function getStrictDocTypes(preset: string = 'qsh'): string[] {
  return loadRules(preset).strictDocTypes;
}
