import PizZip from 'pizzip';
import type { DocumentStructure, MetadataForm } from '../types/document';
import type { TemplateConfig } from '../types/template';

/**
 * 将前端提取出的公文内容注入到标准的 Word 模板中
 *
 * 方案设计（Hybrid Template Injection）：
 * 1. 动态加载位于 /templates/{preset}/{docType}.docx 的预先制作的模板
 * 2. 使用 PizZip 解压 .docx
 * 3. 提取 word/document.xml，通过 DOMParser 把 XML 转为可操作的 DOM 树
 * 4. 寻找注入点（占位符 {{BODY_PLACEHOLDER}} 或 <w:body> 尾部）
 * 5. 将 DocumentStructure 中的各 block 转为标准 <w:p>，<w:pStyle w:val="xxx"/> 指向对应样式。
 * 6. 生成 Blob 供用户下载
 *
 * NOTE：页脚/页眉文件（footer1.xml、footer2.xml、header1.xml 等）一律原样保留，
 * 不做任何修改，以避免页码域代码格式被破坏（VBA 版本的 — N — 变成 （N）N（N） 的 bug 根因）。
 */
export async function exportDocx(
  structure: DocumentStructure,
  metadata: MetadataForm,
  templateConfig: TemplateConfig
): Promise<Blob> {
  // 1. 确定需要请求的模板路径
  // fallback 为通用逻辑，由于用户还没上传模板，我们这里先写死假设 /templates 目录在 public 下
  // "none" 时，尝试降级加载 GB 模板
  const preset = templateConfig.wordTemplatePreset === 'none' ? 'gb' : templateConfig.wordTemplatePreset;
  const tplUrl = `/templates/${preset}/${structure.docType}.docx`;

  let response: Response;
  try {
    response = await fetch(tplUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (err: any) {
    throw new Error(`无法获取基础 Word 模板档案 (${tplUrl})，请确认管理员已在服务端 public/templates 目录提供该文件。原始错误：${err.message}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // 2. 利用 PizZip 加载
  const zip = new PizZip(arrayBuffer);
  
  // 3. 读取 document.xml
  const docXmlString = zip.file('word/document.xml')?.asText();
  if (!docXmlString) {
    throw new Error('Word 模板似乎已损坏，未找到 word/document.xml');
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(docXmlString, 'text/xml');
  const body = xmlDoc.getElementsByTagName('w:body')[0];
  if (!body) throw new Error('无法在模板中定位到 <w:body>');

  // -----------------------------------------------------------------------
  // NOTE: 页码 Bug 防御 —— 验证 sectPr 中的 pgNumType 格式
  // VBA 版本出现过 — N — 变为 （N）N（N） 的 bug，根因是页码域格式被重置为中文格式。
  // 我们的 Web 工具通过「永不触碰页脚文件」来规避此问题，但仍需验证 sectPr 声明正确。
  // -----------------------------------------------------------------------
  const sectPrList = xmlDoc.getElementsByTagName('w:sectPr');
  if (sectPrList.length > 0) {
    const sectPr = sectPrList[sectPrList.length - 1]; // 取最后一个（文档级 sectPr）
    const pgNumType = sectPr.getElementsByTagName('w:pgNumType')[0];
    if (pgNumType) {
      const fmt = pgNumType.getAttribute('w:fmt');
      // 若页码格式被设置为中文格式，强制纠正为阿拉伯数字
      // 中文格式：chineseCounting / chineseCountingThousand / chineseLegalSimplified
      const chineseFmts = ['chineseCounting', 'chineseCountingThousand', 'chineseLegalSimplified'];
      if (fmt && chineseFmts.includes(fmt)) {
        console.warn(`[templateInjector] 检测到页码格式为中文格式 (${fmt})，已自动纠正为 decimal（阿拉伯数字）。`);
        pgNumType.setAttribute('w:fmt', 'decimal');
      }
    }
  }

  // 辅助：生成一个带有样式的段落节点
  const createParagraph = (text: string, styleId: string): Element => {
    // <w:p>
    //   <w:pPr><w:pStyle w:val="styleId"/></w:pPr>
    //   <w:r><w:t>text</w:t></w:r>
    // </w:p>
    const p = xmlDoc.createElement('w:p');
    const pPr = xmlDoc.createElement('w:pPr');
    const pStyle = xmlDoc.createElement('w:pStyle');
    pStyle.setAttribute('w:val', styleId);
    pPr.appendChild(pStyle);
    p.appendChild(pPr);

    const r = xmlDoc.createElement('w:r');
    const t = xmlDoc.createElement('w:t');
    t.textContent = text;
    r.appendChild(t);
    p.appendChild(r);

    return p;
  };

  /**
   * =============== 核心注入逻辑 ===============
   * 目前采用简单替换法（假设模板里人为写了一段文字 `{{BODY_PLACEHOLDER}}`）
   */
  const texts = xmlDoc.getElementsByTagName('w:t');
  let targetP: Element | null = null;
  
  for (let i = 0; i < texts.length; i++) {
    const tNode = texts[i];
    if (tNode.textContent && tNode.textContent.includes('{{BODY_PLACEHOLDER}}')) {
      // 找到了占位符，向上找到包含它的最近的 <w:p>
      let parent = tNode.parentNode;
      while (parent && parent.nodeName !== 'w:p') {
        parent = parent.parentNode;
      }
      targetP = parent as Element;
      break;
    }
  }

  // 转换需要插入的所有片段
  const fragments: Element[] = [];

  // 例如插入主标题（假如未在外部处理）
  if (structure.title) {
    fragments.push(createParagraph(structure.title, 'GW_Title'));
  }

  // 主送机关
  if (structure.salutation) {
    fragments.push(createParagraph(structure.salutation, 'GW_Salutation'));
  }

  // 正文遍历
  for (const block of structure.body) {
    let styleId = 'GW_Body';
    if (block.type === 'h1') styleId = 'GW_H1';
    else if (block.type === 'h2') styleId = 'GW_H2';
    else if (block.type === 'h3') styleId = 'GW_H3';
    else if (block.type === 'h4') styleId = 'GW_H4';
    else if (block.type === 'h5') styleId = 'GW_H5';
    else if (block.type === 'attachment') styleId = 'GW_Attachment';

    fragments.push(createParagraph(block.text, styleId));
  }

  // 落款
  if (structure.signoff) {
    fragments.push(createParagraph(structure.signoff.organization, 'GW_SignoffOrg'));
    fragments.push(createParagraph(structure.signoff.date, 'GW_SignoffDate'));
  }

  // 插入到 DOM 中
  if (targetP && targetP.parentNode) {
    // 插入在 targetP 之前
    const parentNode = targetP.parentNode;
    for (const frag of fragments) {
      parentNode.insertBefore(frag, targetP);
    }
    // 然后删掉那个占位段落
    parentNode.removeChild(targetP);
  } else {
    // 如果没有占位符，直接把所有段落追加到 body 尾部（sectPr的前面）
    const sectPr = xmlDoc.getElementsByTagName('w:sectPr')[0];
    for (const frag of fragments) {
      if (sectPr) {
        body.insertBefore(frag, sectPr);
      } else {
        body.appendChild(frag);
      }
    }
  }

  // -----------------------------------------------------------------------
  // NOTE: 使用 XMLSerializer 前的命名空间保护
  // 浏览器 XMLSerializer 有时会在序列化时为缺少显式 ns 声明的元素补充 xmlns=""
  // 这会导致 Word 无法解析该 XML。解决方法：把序列化后 innerHTML 中多余的 xmlns="" 删除。
  // -----------------------------------------------------------------------
  const serializer = new XMLSerializer();
  let modifiedXmlString = serializer.serializeToString(xmlDoc);
  // 清理 XMLSerializer 产生的多余空命名空间声明，防止 Word 解析失败
  modifiedXmlString = modifiedXmlString.replace(/ xmlns=""/g, '');
  zip.file('word/document.xml', modifiedXmlString);

  // 5. 将处理好的文件生成 Blob 返回
  const outBuffer = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return outBuffer;
}
