// @vitest-environment jsdom
/**
 * @fileoverview contentWidth — how wide the screens get (docs/product/features/settings.md S3)
 * Cases: every width but AUTO has its class in components.css, with V1's px value in rem; a stored
 * value is checked; the class on the root element switches and AUTO needs none.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONTENT_WIDTHS,
  DEFAULT_CONTENT_WIDTH,
  applyContentWidth,
  isContentWidth,
} from '../../src/lib/contentWidth';

describe('contentWidth', () => {
  it("gives every width but AUTO a class with V1's value (900, 1100, 1400 px)", () => {
    const css = readFileSync(
      join(__dirname, '..', '..', 'src', 'styles', 'components.css'),
      'utf8',
    );
    const px = (w: string) => {
      const m = new RegExp(`^\\.sb-width-${w} \\{[^}]*--content-max: ([\\d.]+)rem;`, 'm').exec(css);
      return m ? Number(m[1]) * 16 : null;
    };
    expect(CONTENT_WIDTHS[0]).toBe(DEFAULT_CONTENT_WIDTH);
    expect(CONTENT_WIDTHS.slice(1).map(px)).toEqual([900, 1100, 1400]);
  });

  it('knows a width only by its id', () => {
    expect(isContentWidth('wide')).toBe(true);
    expect(isContentWidth('WIDE')).toBe(false);
    expect(isContentWidth(900)).toBe(false);
  });

  it('puts one width class on the root and none for AUTO', () => {
    const root = document.createElement('html');
    root.classList.add('sb-theme-neon');
    applyContentWidth(root, 'compact');
    expect([...root.classList]).toEqual(['sb-theme-neon', 'sb-width-compact']);
    applyContentWidth(root, 'wide');
    expect([...root.classList]).toEqual(['sb-theme-neon', 'sb-width-wide']);
    applyContentWidth(root, 'auto');
    expect([...root.classList]).toEqual(['sb-theme-neon']);
  });
});
