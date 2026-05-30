import { describe, it, expect } from 'vitest';
import { validateStructure } from '../../src/core/validator';
import type { DocumentStructure } from '../../src/types/document';

describe('validator', () => {
  it('should validate missing mandatory fields for strict docTypes', () => {
    const structure: DocumentStructure = {
      docType: '通知', // strict type
      title: '关于放假的通知',
      body: [{ id: 'b1', type: 'body', text: '放假3天' }]
      // missing salutation, signoff
    };
    
    const results = validateStructure(structure, null, 'qsh');
    
    const salutationRes = results.find(r => r.id === 'has-salutation');
    expect(salutationRes?.passed).toBe(false);
    expect(salutationRes?.level).toBe('warning'); // salutation is warning
    
    const signoffOrgRes = results.find(r => r.id === 'has-signoff-org');
    expect(signoffOrgRes?.passed).toBe(false);
    expect(signoffOrgRes?.level).toBe('error');
    
    const signoffDateRes = results.find(r => r.id === 'has-signoff-date');
    expect(signoffDateRes?.passed).toBe(false);
    expect(signoffDateRes?.level).toBe('error');
  });

  it('should pass if all fields present', () => {
    const structure: DocumentStructure = {
      docType: '通知',
      title: '关于放假的通知',
      salutation: '各部门：',
      signoff: {
        organization: '公司办',
        date: '2026年5月30日'
      },
      body: [{ id: 'b1', type: 'body', text: '放假3天' }]
    };
    
    const results = validateStructure(structure, null, 'qsh');
    
    expect(results.find(r => r.id === 'has-salutation')?.passed).toBe(true);
    expect(results.find(r => r.id === 'has-signoff-org')?.passed).toBe(true);
    expect(results.find(r => r.id === 'has-signoff-date')?.passed).toBe(true);
  });
});
