import type { DocumentStructure } from '../types/document';
import type { TemplateConfig } from '../types/template';
import { buildDocxFromScratch } from './templateInjector';

/** Build a reusable local Word template containing the injector placeholder. */
export function generateBlankWordTemplate(template: TemplateConfig): Blob {
  const structure: DocumentStructure = {
    docType: '其他',
    title: '',
    body: [{ id: 'template_body', type: 'body', text: '{{BODY_PLACEHOLDER}}' }],
  };
  return buildDocxFromScratch(structure, template);
}

export function templateDownloadName(template: TemplateConfig): string {
  const safeName = template.name.replace(/[\\/:*?"<>|]+/g, '-').trim() || '公文模板';
  return `${safeName}-空白模板.docx`;
}
