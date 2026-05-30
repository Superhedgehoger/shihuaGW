import { describe, it, expect } from 'vitest';
import { parseDocument } from '../../src/core/ruleParser';
import fs from 'fs';
import path from 'path';

describe('ruleParser', () => {
  it('should parse standard QSH document correctly', () => {
    const rawText = fs.readFileSync(path.resolve(__dirname, '../fixtures/qsh-standard.txt'), 'utf-8');
    const structure = parseDocument(rawText, '通知', undefined, 'qsh');
    
    expect(structure.docType).toBe('通知');
    expect(structure.title).toBe('关于加强系统安全测试的通知');
    expect(structure.salutation).toBe('各业务部门：');
    expect(structure.signoff?.organization).toBe('XX公司信息部');
    expect(structure.signoff?.date).toBe('2026年5月30日');
    
    // Check heading hierarchy
    const h1s = structure.body.filter(b => b.type === 'h1');
    expect(h1s).toHaveLength(2);
    expect(h1s[0].text).toBe('一、总体要求');
    
    const h2s = structure.body.filter(b => b.type === 'h2');
    expect(h2s).toHaveLength(2);
    expect(h2s[0].text).toBe('（一）强化测试');
    
    const h3s = structure.body.filter(b => b.type === 'h3');
    expect(h3s).toHaveLength(2);
    expect(h3s[0].text).toBe('1．每日复盘。');
    
    const attachments = structure.attachments;
    expect(attachments).toBeDefined();
    expect(attachments?.length).toBe(3);
  });
});
