/**
 * Word 模板中预定义的命名样式常量
 * 这些字符串必须与 Word 模板中的样式名称完全一致（区分大小写）
 */
export const STYLE = {
  title: 'GW_主标题',
  h1: 'GW_一级标题',
  h2: 'GW_二级标题',
  h3: 'GW_三级标题',
  h4: 'GW_四级标题',
  body: 'GW_正文',
  salutation: 'GW_主送机关',
  signoffOrg: 'GW_落款机关',
  signoffDate: 'GW_落款日期',
  attachment: 'GW_附件说明',
  colophon: 'GW_版记',
} as const;

export type StyleKey = keyof typeof STYLE;
