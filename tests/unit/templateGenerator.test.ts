import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import { QSH_TEMPLATE } from '../../src/constants/defaultTemplates';
import { generateBlankWordTemplate, templateDownloadName } from '../../src/core/templateGenerator';

describe('blank Word template generator', () => {
  it('creates OOXML with the injector placeholder and configured margins', async () => {
    const zip = new PizZip(await generateBlankWordTemplate(QSH_TEMPLATE).arrayBuffer());
    const documentXml = zip.file('word/document.xml')?.asText() ?? '';
    expect(zip.file('[Content_Types].xml')).not.toBeNull();
    expect(zip.file('word/styles.xml')).not.toBeNull();
    expect(documentXml).toContain('{{BODY_PLACEHOLDER}}');
    expect(documentXml).toContain('w:left="1588"');
    expect(documentXml).toContain('w:right="1475"');
  });

  it('sanitizes the downloaded filename', () => {
    expect(templateDownloadName({ ...QSH_TEMPLATE, name: 'Q/SH:模板' })).toBe('Q-SH-模板-空白模板.docx');
  });
});
