import { describe, it, expect } from 'vitest';
import { runDiagnostics } from '../../src/core/diagnostics';
import type { DocumentStructure } from '../../src/types/document';

describe('diagnostics', () => {
  it('should detect punctuation issues', () => {
    const structure: DocumentStructure = {
      docType: '报告',
      title: '报告',
      salutation: '领导：',
      signoff: { organization: '部门', date: '2026年1月1日' },
      body: [
        { id: 'b1', type: 'body', text: '今天天气不错.' }, // half-width period
        { id: 'b2', type: 'body', text: '大家觉得呢?' }, // half-width question mark
      ]
    };
    
    const report = runDiagnostics(structure, 'qsh');
    const puncIssues = report.issues.filter(i => i.type === 'punctuation');
    expect(puncIssues.length).toBeGreaterThan(0);
    expect(puncIssues.some(i => i.message.includes('半角标点'))).toBe(true);
  });
  
  it('should detect missing structure in strict doc types', () => {
    const structure: DocumentStructure = {
      docType: '报告',
      title: '',
      body: []
    };
    
    const report = runDiagnostics(structure, 'qsh');
    const structIssues = report.issues.filter(i => i.type === 'structure');
    expect(structIssues.some(i => i.message.includes('未识别到文档标题'))).toBe(true);
    expect(structIssues.some(i => i.message.includes('通常需要主送机关'))).toBe(true);
    expect(structIssues.some(i => i.message.includes('发文机关署名'))).toBe(true);
    expect(structIssues.some(i => i.message.includes('落款日期'))).toBe(true);
  });
});
