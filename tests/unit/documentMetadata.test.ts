import { describe, expect, it } from 'vitest';
import {
  applyMetadataToStructure,
  getColophonLines,
  getHeaderMetadataLines,
  populateMetadataFromStructure,
} from '../../src/core/documentMetadata';
import type { DocumentStructure, MetadataForm } from '../../src/types/document';

const emptyMetadata: MetadataForm = {
  fileNumber: '', salutation: '', signoffOrg: '', signoffDate: '', cc: '',
  meetingNumber: '', drafter: '', dept: '', phone: '', deptReviewer: '',
  officeReviewer: '', approver: '',
};

describe('document metadata', () => {
  it('uses detected structure values to populate empty form fields', () => {
    const structure: DocumentStructure = {
      docType: '通知',
      title: '通知',
      salutation: '各部门：',
      body: [],
      signoff: { organization: '办公室', date: '2026年8月11日' },
      cc: ['所属单位'],
    };

    expect(populateMetadataFromStructure(emptyMetadata, structure)).toMatchObject({
      salutation: '各部门：',
      signoffOrg: '办公室',
      signoffDate: '2026年8月11日',
      cc: '所属单位',
    });
  });

  it('merges editable metadata into the canonical structure and presentation lines', () => {
    const structure: DocumentStructure = { docType: '红头文件', title: '通知', body: [] };
    const metadata: MetadataForm = {
      ...emptyMetadata,
      fileNumber: '石化发〔2026〕1号',
      salutation: '各单位：',
      signoffOrg: '中国石化',
      signoffDate: '2026年8月11日',
      cc: '总部机关；所属企业',
      dept: '综合部',
      drafter: '张三',
      phone: '010-12345678',
      deptReviewer: '王五',
      officeReviewer: '赵六',
      approver: '李四',
    };

    const merged = applyMetadataToStructure(structure, metadata);
    expect(merged.salutation).toBe('各单位：');
    expect(merged.signoff).toEqual({ organization: '中国石化', date: '2026年8月11日' });
    expect(merged.cc).toEqual(['总部机关', '所属企业']);
    expect(getHeaderMetadataLines(merged)).toEqual(['石化发〔2026〕1号']);
    expect(getColophonLines(merged)).toEqual([
      '抄送：总部机关；所属企业',
      '拟稿部门：综合部　拟稿人：张三　联系电话：010-12345678　部门审核：王五　办公室审核：赵六　签发人：李四',
    ]);
  });
});
