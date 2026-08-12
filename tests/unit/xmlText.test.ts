import { describe, expect, it } from 'vitest';
import { sanitizeXmlText } from '../../src/core/xmlText';

describe('XML text sanitizer', () => {
  it('removes forbidden controls and preserves CJK extensions and emoji', () => {
    expect(sanitizeXmlText(`标题\u0000𠀀😀\n正文`)).toBe('标题𠀀😀\n正文');
  });
});
