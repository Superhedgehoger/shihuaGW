/// <reference types="vite/client" />

/**
 * CSS 模块类型声明
 * 告知 TypeScript import styles from '*.module.css' 返回 Record<string, string>
 */
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

/** .docx 文件通过 Vite ?url 导入时的类型声明 */
declare module '*.docx?url' {
  const url: string;
  export default url;
}

declare module '*.docx' {
  const url: string;
  export default url;
}
