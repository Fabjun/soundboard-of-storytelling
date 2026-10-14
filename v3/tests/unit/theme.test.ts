// @vitest-environment jsdom
/**
 * @fileoverview theme — the app's color themes (docs/product/features/settings.md S5)
 * Cases: the theme list matches the theme blocks of tokens.css, every theme sets the flame colors,
 * a stored value is checked, the class on the root element switches and Hearth needs none.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_THEME, THEMES, applyTheme, isThemeId } from '../../src/lib/theme';

describe('theme', () => {
  it('offers Hearth and every theme block of tokens.css, Hearth first', () => {
    const css = readFileSync(join(__dirname, '..', '..', 'src', 'styles', 'tokens.css'), 'utf8');
    const blocks = [...new Set([...css.matchAll(/^\.sb-theme-([a-z]+) \{/gm)].map((m) => m[1]))];
    expect(THEMES[0]).toBe(DEFAULT_THEME);
    expect([...THEMES.slice(1)].sort()).toEqual(blocks.sort());
  });

  it('every theme gives the animated flame its own colors (S5, flame-themes.jsx)', () => {
    const css = readFileSync(join(__dirname, '..', '..', 'src', 'styles', 'tokens.css'), 'utf8');
    const flameTokens = ['--flame-outer', '--flame-mid', '--flame-core', '--flame-heart'];
    const missing = THEMES.slice(1).flatMap((t) => {
      // A theme may have several blocks (the alias list names it too); together they must set all
      const body = [...css.matchAll(new RegExp(`^\\.sb-theme-${t} \\{([^}]*)\\}`, 'gm'))]
        .map((m) => m[1])
        .join('\n');
      return flameTokens.filter((tok) => !body.includes(`${tok}:`)).map((tok) => `${t}: ${tok}`);
    });
    expect(missing).toEqual([]);
  });

  it('knows a theme only by its id', () => {
    expect(isThemeId('neon')).toBe(true);
    expect(isThemeId('NEON')).toBe(false);
    expect(isThemeId('modern')).toBe(false);
    expect(isThemeId(undefined)).toBe(false);
  });

  it('puts one theme class on the root and none for Hearth', () => {
    const root = document.createElement('html');
    root.classList.add('other');
    applyTheme(root, 'neon');
    expect([...root.classList]).toEqual(['other', 'sb-theme-neon']);
    applyTheme(root, 'crimson');
    expect([...root.classList]).toEqual(['other', 'sb-theme-crimson']);
    applyTheme(root, 'hearth');
    expect([...root.classList]).toEqual(['other']);
  });
});
