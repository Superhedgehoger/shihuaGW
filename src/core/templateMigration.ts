import { GB_TEMPLATE, QSH_TEMPLATE } from '../constants/defaultTemplates';
import type { ElementStyle, TemplateConfig } from '../types/template';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function migrateStyle(value: unknown, fallback: ElementStyle): ElementStyle {
  if (!isObject(value)) return { ...fallback };
  const size = numberOr(value.size, fallback.size);
  const fallbackIndentChars = size > 0 ? fallback.indentPt / size : 0;
  const indentChars = numberOr(value.indent, fallbackIndentChars);
  return {
    fontCn: typeof value.fontCn === 'string' ? value.fontCn : fallback.fontCn,
    fontEn: typeof value.fontEn === 'string' ? value.fontEn : fallback.fontEn,
    size,
    isBold: typeof value.isBold === 'boolean'
      ? value.isBold
      : (typeof value.bold === 'boolean' ? value.bold : fallback.isBold),
    align: ['left', 'center', 'right', 'justify'].includes(String(value.align))
      ? value.align as ElementStyle['align']
      : fallback.align,
    indentPt: numberOr(value.indentPt, indentChars * size),
    lineSpacingPt: numberOr(value.lineSpacingPt, numberOr(value.lineHeight, fallback.lineSpacingPt ?? 28)),
  };
}

/** Convert one shihua-doc-formatter template into the shihuaGW v3 model. */
export function migrateLegacyTemplate(value: unknown): Omit<TemplateConfig, 'id'> | null {
  if (!isObject(value) || typeof value.name !== 'string' || !value.name.trim()) return null;

  const isGb = String(value.standard ?? '').toLowerCase().includes('gb');
  const base = isGb ? GB_TEMPLATE : QSH_TEMPLATE;
  const oldStyles = isObject(value.styles) ? value.styles : {};
  const oldMargins = isObject(value.margins) ? value.margins : {};
  const styleKeyMap: Record<keyof TemplateConfig['styles'], string> = {
    title: 'title',
    salutation: 'salutation',
    heading1: 'h1',
    heading2: 'h2',
    heading3: 'h3',
    heading4: 'h4',
    heading5: 'h5',
    body: 'body',
    signoffOrg: 'signoffOrg',
    signoffDate: 'signoffDate',
    attachment: 'attachment',
    colophon: 'colophon',
  };

  const styles = Object.fromEntries(
    Object.entries(styleKeyMap).map(([newKey, oldKey]) => [
      newKey,
      migrateStyle(oldStyles[oldKey], base.styles[newKey as keyof TemplateConfig['styles']]),
    ])
  ) as TemplateConfig['styles'];

  return {
    name: value.name.trim(),
    description: typeof value.description === 'string'
      ? `${value.description}（由旧版模板迁移）`
      : '由 shihua-doc-formatter 旧版模板迁移',
    isBuiltin: false,
    wordTemplatePreset: isGb ? 'gb' : 'qsh',
    rulesStandard: isGb ? 'gb' : 'qsh',
    page: {
      top: numberOr(oldMargins.top, base.page.top),
      bottom: numberOr(oldMargins.bottom, base.page.bottom),
      left: numberOr(oldMargins.left, base.page.left),
      right: numberOr(oldMargins.right, base.page.right),
    },
    styles,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** Accept the old export envelope, a single old template, or the old localStorage array. */
export function readLegacyTemplates(value: unknown): Omit<TemplateConfig, 'id'>[] {
  let candidates: unknown[] = [];
  if (Array.isArray(value)) {
    candidates = value;
  } else if (isObject(value) && Array.isArray(value.templates)) {
    candidates = value.templates;
  } else if (isObject(value) && value.standard && value.styles) {
    candidates = [value];
  }
  return candidates
    .map(migrateLegacyTemplate)
    .filter((template): template is Omit<TemplateConfig, 'id'> => template !== null);
}

/** Merge old templates without duplicating names already present in the v3 store. */
export function mergeLegacyTemplates(
  user: Record<string, TemplateConfig>,
  value: unknown,
  createId: () => string,
): { user: Record<string, TemplateConfig>; imported: number } {
  const merged = { ...user };
  const existingNames = new Set(
    Object.values(user).map(template => template.name.trim().toLocaleLowerCase())
  );
  let imported = 0;

  for (const template of readLegacyTemplates(value)) {
    const normalizedName = template.name.trim().toLocaleLowerCase();
    if (existingNames.has(normalizedName)) continue;
    const id = createId();
    merged[id] = { ...template, id };
    existingNames.add(normalizedName);
    imported += 1;
  }

  return { user: merged, imported };
}
