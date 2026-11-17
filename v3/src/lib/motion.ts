/**
 * @fileoverview motion — whether the app animates (docs/product/features/settings.md S6, Slice 14c)
 *
 * WCAG 2.2 SC 2.2.2 Pause, Stop, Hide (Level A): moving content that starts by itself, lasts over
 * five seconds and sits next to other content — the flame on the start screen and in the menu —
 * needs a way to stop it; W3C recommends one control for all motion. Settings → VISUALS →
 * Animations is that control. S12: reduced motion follows the system and an app option only adds
 * to it — the switch can stop the motion, never bring it back when the system asks for less.
 */

/** True when the system asks for reduced motion (`prefers-reduced-motion: reduce`). */
export function systemPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Returns whether the app animates: only while the switch is on and the system asks for no less. */
export function motionAllowed(switchedOn: boolean, systemReduce: boolean): boolean {
  return switchedOn && !systemReduce;
}

/**
 * Puts the motion state on the root element: `sb-motion-off` while the app must not animate, so
 * the CSS animations of the atmosphere (the aura, the breathing loops) stand still — as the theme
 * and the content width are classes there (src/lib/theme.ts, src/lib/contentWidth.ts).
 */
export function applyMotion(root: Element, on: boolean): void {
  root.classList.toggle('sb-motion-off', !on);
}
