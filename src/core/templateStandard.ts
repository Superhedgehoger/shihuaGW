import type { TemplateConfig } from '../types/template';

export type RulesStandard = 'qsh' | 'gb';

export function resolveRulesStandard(template: TemplateConfig): RulesStandard {
  if (template.rulesStandard === 'gb' || template.rulesStandard === 'qsh') {
    return template.rulesStandard;
  }
  return template.wordTemplatePreset === 'gb' ? 'gb' : 'qsh';
}
