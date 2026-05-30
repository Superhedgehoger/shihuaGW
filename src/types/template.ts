/**
 * 单个段落元素的格式样式配置
 */
export interface ElementStyle {
  /** 中文字体名称 */
  fontCn: string;
  /** 英文字体名称 */
  fontEn: string;
  /** 字号（pt） */
  size: number;
  /** 是否加粗 */
  isBold: boolean;
  /** 对齐方式 */
  align: 'left' | 'center' | 'right' | 'justify';
  /** 首行缩进（磅值，0=无缩进） */
  indentPt: number;
  /** 固定行距（磅值），undefined 表示自动 */
  lineSpacingPt?: number;
}

/** 页面边距配置（单位：cm） */
export interface PageMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** 一套完整的公文格式模板配置 */
export interface TemplateConfig {
  /** 唯一标识（内置：'qsh' | 'gb'，自定义：UUID） */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板说明 */
  description?: string;
  /** 是否为内置只读模板 */
  isBuiltin: boolean;
  /** 关联的 Word 模板标准（影响导出时使用哪组 .docx 模板文件） */
  wordTemplatePreset: 'qsh' | 'gb' | 'none';
  /** 绑定的公文规则标准（影响标题识别、必填项校验等，默认同 wordTemplatePreset） */
  rulesStandard?: string;
  /** 自定义上传的 Word 模板文件（Base64 编码，用于完全替换默认模板的导出结构） */
  base64Docx?: string;
  /** 页面边距 */
  page: PageMargin;
  /** 各段落元素样式 */
  styles: {
    title: ElementStyle;
    salutation: ElementStyle;
    heading1: ElementStyle;
    heading2: ElementStyle;
    heading3: ElementStyle;
    heading4: ElementStyle;
    heading5: ElementStyle;
    body: ElementStyle;
    signoffOrg: ElementStyle;
    signoffDate: ElementStyle;
    attachment: ElementStyle;
    colophon: ElementStyle;
  };
  /** 创建时间戳（ISO 字符串） */
  createdAt?: string;
  /** 最后修改时间戳 */
  updatedAt?: string;
}

/** localStorage 中存储的完整模板仓库 */
export interface TemplateStore {
  /** 内置只读模板 */
  builtin: Record<string, TemplateConfig>;
  /** 用户自定义模板（可读写） */
  user: Record<string, TemplateConfig>;
  /** 当前使用的模板 ID */
  activeTemplateId: string;
}
