/** Remove characters that XML 1.0 cannot represent while preserving Unicode astral planes. */
export function sanitizeXmlText(value: string): string {
  return value.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
}
