/**
 * 解析纯文本文件
 * @param file .txt 文件
 * @returns 提取的文本字符串
 */
export async function parseTxt(file: File): Promise<string> {
  return await file.text();
}
