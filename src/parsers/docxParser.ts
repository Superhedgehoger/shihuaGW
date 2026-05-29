import * as mammoth from 'mammoth';
import { extractFonts, FontMapItem } from '../core/fontExtractor';

/**
 * 解析 docx 文件，提取为按段落分隔的纯文本并提取字体信息
 * @param file .docx 文件
 * @returns 提取的纯文本字符串和字体信息数组
 */
export async function parseDocxToText(file: File): Promise<{ text: string, fonts: FontMapItem[] }> {
  const arrayBuffer = await file.arrayBuffer();
  
  // 提取纯文本
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  // 提取字体信息
  let fonts: FontMapItem[] = [];
  try {
    fonts = extractFonts(arrayBuffer);
  } catch (error) {
    console.error('提取字体失败:', error);
  }
  
  return { text: result.value, fonts };
}
