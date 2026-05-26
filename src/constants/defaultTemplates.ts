import type { TemplateConfig } from '../types/template';

/**
 * 内置模板：Q/SH 0758—2019（中国石化企业内部公文标准）
 * 此模板为只读，不可修改
 */
export const QSH_TEMPLATE: TemplateConfig = {
  id: 'qsh',
  name: 'Q/SH 0758—2019',
  description: '中国石化企业内部公文标准，左边距2.8cm，右边距2.6cm',
  isBuiltin: true,
  wordTemplatePreset: 'qsh',
  page: { top: 3.7, bottom: 3.5, left: 2.8, right: 2.6 },
  styles: {
    title: {
      fontCn: '方正小标宋简体',
      fontEn: 'Times New Roman',
      size: 22,
      isBold: false,
      align: 'center',
      indentPt: 0,
      lineSpacingPt: 28,
    },
    salutation: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 0,
      lineSpacingPt: 28,
    },
    heading1: {
      fontCn: '黑体',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    heading2: {
      fontCn: '楷体',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    heading3: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    heading4: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    heading5: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    body: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'justify',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    signoffOrg: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'right',
      indentPt: 0,
      lineSpacingPt: 28,
    },
    signoffDate: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'center',
      indentPt: 0,
      lineSpacingPt: 28,
    },
    attachment: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 16,
      isBold: false,
      align: 'left',
      indentPt: 32,
      lineSpacingPt: 28,
    },
    colophon: {
      fontCn: '仿宋',
      fontEn: 'Times New Roman',
      size: 14,
      isBold: false,
      align: 'left',
      indentPt: 0,
      lineSpacingPt: 22,
    },
  },
};

/**
 * 内置模板：GB/T 9704—2012（党政机关通用公文国家标准）
 * 与 Q/SH 的差异仅在页边距（左右各3.17cm）
 */
export const GB_TEMPLATE: TemplateConfig = {
  ...QSH_TEMPLATE,
  id: 'gb',
  name: 'GB/T 9704—2012',
  description: '党政机关通用公文国家标准，左边距3.17cm，右边距3.17cm',
  wordTemplatePreset: 'gb',
  page: { top: 3.7, bottom: 3.5, left: 3.17, right: 3.17 },
  // NOTE: styles 与 Q/SH 完全一致，通过展开运算符继承
  styles: { ...QSH_TEMPLATE.styles },
};

/**
 * 内置模板：通用公文格式（基于 GB/T 9704—2012）
 * 适用于所有法定公文类型（报告、通知、请示等），不绑定特定 Word 模板文件
 * NOTE: wordTemplatePreset 设为 'none'，导出时走通用生成路径
 */
export const GB_GENERAL_TEMPLATE: TemplateConfig = {
  ...GB_TEMPLATE,
  id: 'gb_general',
  name: '通用公文格式',
  description: '适用于报告、通知、请示等所有法定公文类型，遵循 GB/T 9704—2012 国家标准',
  wordTemplatePreset: 'gb',
  // NOTE: 页面边距与 GB 标准一致
};

/**
 * 内置模板：通用石化公文格式（基于 Q/SH 0758—2019）
 * 适用于中国石化内部各类公文，不绑定特定 Word 模板文件
 * NOTE: wordTemplatePreset 设为 'qsh'，导出时走石化标准生成路径
 */
export const QSH_GENERAL_TEMPLATE: TemplateConfig = {
  ...QSH_TEMPLATE,
  id: 'qsh_general',
  name: '通用石化公文格式',
  description: '适用于中国石化内部各类公文，遵循 Q/SH 0758—2019 企业标准，左边距2.8cm，右边距2.6cm',
  wordTemplatePreset: 'qsh',
  // NOTE: 页面边距与 Q/SH 标准一致
};

/** 所有内置模板的集合，键为模板ID */
export const BUILTIN_TEMPLATES: Record<string, TemplateConfig> = {
  qsh: QSH_TEMPLATE,
  gb: GB_TEMPLATE,
  gb_general: GB_GENERAL_TEMPLATE,
  qsh_general: QSH_GENERAL_TEMPLATE,
};

/** 默认激活的模板 ID */
export const DEFAULT_TEMPLATE_ID = 'qsh';
