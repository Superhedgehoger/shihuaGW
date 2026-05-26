import * as mammoth from 'mammoth';

/**
 * 解析 docx 文件，提取为按段落分隔的纯文本
 * @param file .docx 文件
 * @returns 提取的纯文本字符串（保留换行符）
 */
export async function parseDocxToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // mammoth 的 extractRawText 会抽取纯文本并保持段落分隔
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
