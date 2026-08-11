import { describe, expect, it } from 'vitest';
import { QSH_TEMPLATE } from '../../src/constants/defaultTemplates';
import { resolveRulesStandard } from '../../src/core/templateStandard';

describe('template standard resolution', () => {
  it('preserves explicit rules for custom templates without a preset', () => {
    expect(resolveRulesStandard({
      ...QSH_TEMPLATE,
      id: 'custom',
      isBuiltin: false,
      wordTemplatePreset: 'none',
      rulesStandard: 'qsh',
    })).toBe('qsh');
  });

  it('never treats none as a rules standard', () => {
    expect(resolveRulesStandard({
      ...QSH_TEMPLATE,
      id: 'custom',
      isBuiltin: false,
      wordTemplatePreset: 'none',
      rulesStandard: undefined,
    })).toBe('qsh');
  });
});
