import type { TemplateConfig } from './template';

/**
 * 公文类型枚举
 * 包含 GB/T 9704—2012 规定的全部法定公文类型及常用格式
 */
export type DocType =
  // ── 石化内部专用 ──
  | '红头文件'
  | '工作表单'
  // ── 法定公文类型（GB/T 9704—2012 §4） ──
  | '报告'
  | '公报'
  | '公告'
  | '函'
  | '会议纪要'
  | '决定'
  | '决议'
  | '命令'
  | '批复'
  | '请示'
  | '通报'
  | '通告'
  | '通知'
  | '议案'
  | '意见'
  // ── 特殊格式 ──
  | '桌签';

/** 处理模式枚举 */
export type ProcessMode = 'full' | 'diagnose' | 'quickfix';

/** 段落类型枚举 */
export type BlockType =
  | 'title'
  | 'salutation'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'body'
  | 'signoffOrg'
  | 'signoffDate'
  | 'attachment'
  | 'blank';

/** 单个正文段落块 */
export interface BodyBlock {
  /** 唯一 ID，格式 "block_001" */
  id: string;
  /** 段落类型 */
  type: BlockType;
  /** 段落完整文字（含序号） */
  text: string;
  /** 规则引擎不确定时为 true，建议用户核查（显示黄色背景） */
  flagged?: boolean;
}

/** 识别出的完整文档结构 */
export interface DocumentStructure {
  /** 公文类型 */
  docType: DocType;
  /** 主标题文字 */
  title: string;
  /** 发文字号（用户手动填写） */
  fileNumber?: string;
  /** 主送机关，如 "各部门：" */
  salutation?: string;
  /** 正文块数组（含各级标题） */
  body: BodyBlock[];
  /** 落款信息 */
  signoff?: {
    organization: string;
    date: string; // 已规范化，如 "2024年1月15日"
  };
  /** 附件名称列表（不含序号） */
  attachments?: string[];
  /** 抄送机关列表 */
  cc?: string[];
  /** 附注 */
  notes?: string;
  /** 会议纪要专用：纪要编号 */
  meetingNumber?: string;
  /** 会议纪要专用：出席人员 */
  attendees?: string[];
  /** 工作表单专用：拟稿人 */
  drafter?: string;
  /** 工作表单专用：拟稿部门 */
  dept?: string;
  /** 工作表单专用：签发人 */
  approver?: string;
}

/** 元数据表单（用户手动填写的补充信息） */
export interface MetadataForm {
  fileNumber: string;
  salutation: string;
  signoffOrg: string;
  signoffDate: string;
  cc: string;
  meetingNumber: string;
  drafter: string;
  dept: string;
  phone: string;
  deptReviewer: string;
  officeReviewer: string;
  approver: string;
}

/** 格式诊断问题条目 */
export interface DiagnosticIssue {
  type: 'punctuation' | 'numbering' | 'indent' | 'structure';
  level: 'error' | 'warning' | 'info';
  message: string;
  examples?: string[];
}

/** 格式诊断报告 */
export interface DiagnosticReport {
  total: number;
  hasErrors: boolean;
  issues: DiagnosticIssue[];
}

/** 规范校验条目 */
export interface ValidationResult {
  id: string;
  passed: boolean;
  level: 'error' | 'warning';
  message: string;
}

/** 应用级文档状态 */
export interface DocumentState {
  rawText: string;
  docType: DocType;
  processMode: ProcessMode;
  structure: DocumentStructure | null;
  metadata: MetadataForm;
  diagnosticReport: DiagnosticReport | null;
  validationResults: ValidationResult[];
  isProcessing: boolean;
  activeTemplate: TemplateConfig | null;
}
