/**
 * @fileoverview svgCheck — whether an uploaded file may become an own pad icon (ADR-0092)
 *
 * The checks of the OWASP File Upload Cheat Sheet that fit a file the app keeps itself: an allow
 * list (the extension `.svg` or the type `image/svg+xml` — the type alone can be spoofed), a size
 * limit, and the content itself: text that parses as SVG, with `svg` as its root. The icon is drawn
 * only through `<img>`, so a script inside never runs (library.md L7).
 */

/** The largest SVG file an own icon may be: pad icons are small drawings. */
export const SVG_MAX_BYTES = 100 * 1024;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Parses SVG text; tests pass their own. */
export type SvgParser = (text: string) => Document;

const parseSvg: SvgParser = (text) => new DOMParser().parseFromString(text, 'image/svg+xml');

/** The icon's name: the file name without `.svg`, or "Icon" when nothing is left. */
export function svgIconName(fileName: string): string {
  return (
    fileName
      .trim()
      .replace(/\.svg$/i, '')
      .trim() || 'Icon'
  );
}

/**
 * Says in plain words why the file cannot be an icon, or null when it can. `text` is the file's
 * content; it is only parsed, never shown.
 */
export function svgProblem(
  file: { name: string; type: string; size: number },
  text: string,
  parse: SvgParser = parseSvg,
): string | null {
  if (!/\.svg$/i.test(file.name) && file.type !== 'image/svg+xml') {
    return `${file.name}: only SVG files can be icons.`;
  }
  if (file.size > SVG_MAX_BYTES) {
    return `${file.name}: larger than 100 KB — an icon file must be smaller.`;
  }
  const doc = parse(text);
  const root = doc.documentElement;
  const broken = doc.getElementsByTagName('parsererror').length > 0;
  if (broken || root.localName !== 'svg' || root.namespaceURI !== SVG_NS) {
    return `${file.name}: this file is no SVG drawing the app can read.`;
  }
  return null;
}
