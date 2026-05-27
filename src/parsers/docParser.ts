import * as CFB from 'cfb';

/**
 * 解析老版本二进制 Word 97-2003 (.doc) 文件，提取其纯文本内容
 * 100% 纯前端浏览器本地离线运行，无需任何服务端解析
 *
 * @param file 传入的 .doc 文件
 * @returns 提取的纯文本
 */
export async function parseDocToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  let bytes: Uint8Array;
  try {
    // 1. 使用 CFB 解包 OLE 复合文档
    const cfb = CFB.read(new Uint8Array(arrayBuffer), { type: 'array' });
    
    // 2. 查找 WordDocument 流
    const wordDocEntry = cfb.FileIndex.find(
      entry => entry.name === 'WordDocument' || entry.name.toLowerCase() === 'worddocument'
    );
    
    if (wordDocEntry && wordDocEntry.content) {
      bytes = new Uint8Array(wordDocEntry.content as any);
    } else {
      // Fallback: 如果没有解出 WordDocument 流，直接使用全局二进制扫描
      bytes = new Uint8Array(arrayBuffer);
    }
  } catch (err) {
    console.warn('[docParser] OLE2 复合格式解包失败，切换为全局流直接扫描:', err);
    bytes = new Uint8Array(arrayBuffer);
  }

  // 3. 高鲁棒性双字节 UTF-16LE 启发式文本块提取
  // Word 二进制文档中的主要文本都是以 UTF-16LE 双字节字符紧密存储在流中的
  let text = '';
  const len = bytes.length;

  for (let i = 0; i < len - 1; i += 2) {
    const charCode = bytes[i] | (bytes[i + 1] << 8);
    
    // 过滤并收集有效中文、英文、换行及全角标点字符
    if (
      (charCode >= 0x0020 && charCode <= 0x007E) || // 可见 ASCII
      charCode === 0x000A || // 换行 \n
      charCode === 0x000D || // 回车 \r
      charCode === 0x0009 || // 水平制表符
      (charCode >= 0x4E00 && charCode <= 0x9FFF) || // 汉字区
      (charCode >= 0x3000 && charCode <= 0x303F) || // 全角标点/符号
      (charCode >= 0xFF00 && charCode <= 0xFFEF) || // 全角数字与字母
      (charCode >= 0x2000 && charCode <= 0x206F)    // 全角特殊英文符号
    ) {
      text += String.fromCharCode(charCode);
    }
  }

  // 4. 清理提取文本中的非文本干扰噪音（样式名、控制流描述等）
  // 过滤掉如连续大量的英文控制字符串，或者把换行重整为公文习惯的干净单回车
  let lines = text.split(/[\r\n]+/);
  lines = lines.map(line => {
    // 擦除段落首尾的非可见控制残渣
    let cleanLine = line.replace(/[^\x20-\x7E\u4e00-\u9fa5，。？！：；（）“”——、]/g, '').trim();
    // 如果某一行纯粹是由无意义的短英文样式名（如 Normal, Arial 等）组成，予以过滤
    if (/^(Normal|Heading|Times New Roman|Arial|Calibri|Symbol|Wingdings|MS Mincho|System)$/i.test(cleanLine)) {
      return '';
    }
    return cleanLine;
  });

  // 过滤掉过短的无意义垃圾噪声行
  lines = lines.filter(line => line.length > 0 && !/^[\s_.-]+$/.test(line));

  return lines.join('\n');
}
