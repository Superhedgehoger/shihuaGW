import { describe, expect, it } from 'vitest';
import { mergeLegacyTemplates, migrateLegacyTemplate, readLegacyTemplates } from '../../src/core/templateMigration';
import { QSH_TEMPLATE } from '../../src/constants/defaultTemplates';

describe('legacy template migration', () => {
  const legacy = {
    name: '旧版石化通知',
    standard: 'qsh_0758_2019',
    docType: 'notice',
    margins: { top: 3.8, bottom: 3.4, left: 2.9, right: 2.5 },
    styles: {
      title: { fontCn: '方正小标宋简体', fontEn: 'Times New Roman', size: 22, bold: true, align: 'center', lineHeight: 30 },
      h1: { fontCn: '黑体', size: 16, indent: 2 },
    },
  };

  it('maps old margins and style names into the v3 model', () => {
    const migrated = migrateLegacyTemplate(legacy);
    expect(migrated?.page.left).toBe(2.9);
    expect(migrated?.styles.title.isBold).toBe(true);
    expect(migrated?.styles.heading1.fontCn).toBe('黑体');
    expect(migrated?.styles.heading1.indentPt).toBe(32);
    expect(migrated?.styles.title.indentPt).toBe(0);
    expect(migrated?.styles.salutation.indentPt).toBe(0);
    expect(migrated?.wordTemplatePreset).toBe('qsh');
  });

  it('accepts the old batch export envelope', () => {
    const migrated = readLegacyTemplates({ version: '1.0', templates: [legacy] });
    expect(migrated).toHaveLength(1);
    expect(migrated[0].name).toBe('旧版石化通知');
  });

  it('rejects malformed legacy entries without failing the batch', () => {
    expect(readLegacyTemplates([{}, legacy, null])).toHaveLength(1);
  });

  it('merges legacy data into an existing v3 store without duplicating names', () => {
    const existing = { qsh_copy: { ...QSH_TEMPLATE, id: 'qsh_copy', isBuiltin: false } };
    const result = mergeLegacyTemplates(existing, [legacy, { ...legacy, name: QSH_TEMPLATE.name }], () => 'legacy_1');
    expect(result.imported).toBe(1);
    expect(Object.keys(result.user)).toEqual(['qsh_copy', 'legacy_1']);
    expect(result.user.legacy_1.name).toBe('旧版石化通知');
  });
});
