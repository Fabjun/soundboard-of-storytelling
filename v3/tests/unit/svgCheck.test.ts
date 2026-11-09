// @vitest-environment jsdom
/**
 * @fileoverview svgCheck — which uploaded files may become own pad icons (ADR-0092)
 *
 * jsdom's DOMParser parses the SVG text as the browser would. Edge-case checklist: the extension
 * or the type alone allows a file, neither refuses it; exactly at and just above the size limit;
 * text that is no XML, XML whose root is no SVG, an `svg` root outside the SVG namespace; a
 * script inside a valid SVG is no reason to refuse it (`<img>` never runs it); names.
 */

import { SVG_MAX_BYTES, svgIconName, svgProblem } from '../../src/lib/svgCheck';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8"/></svg>';
const file = (name: string, size = 100, type = '') => ({ name, size, type });

describe('svgProblem', () => {
  it('a readable SVG named .svg, or of the SVG type, can be an icon', () => {
    expect(svgProblem(file('owl.svg'), SVG)).toBeNull();
    expect(svgProblem(file('OWL.SVG'), SVG)).toBeNull();
    expect(svgProblem(file('owl', 100, 'image/svg+xml'), SVG)).toBeNull();
  });

  it('a file that is neither named .svg nor of the SVG type is refused, whatever it holds', () => {
    expect(svgProblem(file('owl.png', 100, 'image/png'), SVG)).toBe(
      'owl.png: only SVG files can be icons.',
    );
  });

  it('the size limit: exactly 100 KB is taken, one byte more is refused', () => {
    expect(svgProblem(file('big.svg', SVG_MAX_BYTES), SVG)).toBeNull();
    expect(svgProblem(file('big.svg', SVG_MAX_BYTES + 1), SVG)).toBe(
      'big.svg: larger than 100 KB — an icon file must be smaller.',
    );
  });

  it('text that is no SVG drawing is refused: no XML, another root, svg outside its namespace', () => {
    const texts = [
      'not xml at all <',
      '<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>',
      '<svg viewBox="0 0 8 8"/>',
      '',
    ];
    // The list names each text that got through
    expect(texts.filter((t) => svgProblem(file('x.svg'), t) === null)).toEqual([]);
    expect(svgProblem(file('x.svg'), texts[0])).toBe(
      'x.svg: this file is no SVG drawing the app can read.',
    );
  });

  it('a script inside a valid SVG does not refuse it — the image never runs it', () => {
    const scripted = SVG.replace('</svg>', '<script>alert(1)</script></svg>');
    expect(svgProblem(file('s.svg'), scripted)).toBeNull();
  });
});

describe('svgIconName', () => {
  it('drops .svg in any case and spaces around; nothing left is "Icon"', () => {
    expect(svgIconName(' Owl call.svg ')).toBe('Owl call');
    expect(svgIconName('dragon.SVG')).toBe('dragon');
    expect(svgIconName('.svg')).toBe('Icon');
    expect(svgIconName('no-extension')).toBe('no-extension');
  });
});
