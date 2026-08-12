import { describe, expect, it } from 'vitest';
import { processDocumentCore } from '../../src/core/documentProcessor';
import type { MetadataForm } from '../../src/types/document';

const emptyMetadata: MetadataForm = {
  fileNumber: '', salutation: '', signoffOrg: '', signoffDate: '', cc: '',
  meetingNumber: '', drafter: '', dept: '', phone: '', deptReviewer: '',
  officeReviewer: '', approver: '',
};

const rawText = [
  '关于测试的通知。',
  '各部门：',
  '三、原始序号',
  '正文。',
  '测试办公室',
  '2026年08月12日',
].join('\n');

describe('document processing pipeline', () => {
  it('keeps detected content unchanged in diagnose mode', () => {
    const result = processDocumentCore({
      rawText,
      docType: '通知',
      processMode: 'diagnose',
      metadata: emptyMetadata,
      rulesStandard: 'qsh',
    });

    expect(result.structure.title).toBe('关于测试的通知。');
    expect(result.structure.body[0].text).toBe('三、原始序号');
    expect(result.metadata.signoffDate).toBe('2026年8月12日');
  });

  it('normalizes title and numbering in formatting modes', () => {
    const result = processDocumentCore({
      rawText,
      docType: '通知',
      processMode: 'full',
      metadata: emptyMetadata,
      rulesStandard: 'qsh',
    });

    expect(result.structure.title).toBe('关于测试的通知');
    expect(result.structure.body[0].text).toBe('一、原始序号');
    expect(result.validationResults.find(item => item.id === 'has-signoff-date')?.passed).toBe(true);
  });

  it('applies safe quick fixes without changing outline numbering', () => {
    const result = processDocumentCore({
      rawText,
      docType: '通知',
      processMode: 'quickfix',
      metadata: emptyMetadata,
      rulesStandard: 'qsh',
    });

    expect(result.structure.title).toBe('关于测试的通知');
    expect(result.structure.body[0].text).toBe('三、原始序号');
  });
});
