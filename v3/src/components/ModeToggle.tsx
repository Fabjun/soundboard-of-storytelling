// ─────────────────────────────────────────────────────────────────────────────
// ModeToggle — interactive SETUP | GAME toggle with spark animation
//
// Source: design-sources/2026-05-25/v24-mode-toggle.jsx
//
// Animation model: hammer-strike — sparks spawn at destination half and
// fly outward in a ~200° fan. ~14 sparks desktop, 8 mobile.
// Reduced-motion: 220ms drop-shadow flash instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import type { AppMode } from '../types';

interface ModeToggleProps {
  mode: AppMode;
  onSwitch: (newMode: AppMode) => void;
  compact?: boolean;
}

// Spark configuration
interface Spark {
  id: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  color: string;
  x: number; // origin x within toggle (%)
  y: number; // origin y within toggle (%)
}

function generateSparks(destMode: AppMode, count: number, rect: DOMRect): Spark[] {
  const color = destMode === 'play' ? 'var(--mode-game)' : 'var(--mode-setup)';
  // Sparks originate at the destination half
  const originXFrac = destMode === 'play' ? 0.75 : 0.25;
  const originX = rect.left + rect.width * originXFrac;
  const originY = rect.top + rect.height / 2;

  return Array.from({ length: count }, (_, i) => {
    // Fan: roughly 200° arc biased upward + toward destination
    const baseAngle = destMode === 'play' ? -30 : -150; // degrees
    const spread = 200;
    const angle = (baseAngle + (i / (count - 1)) * spread) * (Math.PI / 180);
    const distance = 40 + Math.random() * 100; // px

    return {
      id: Date.now() + i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      duration: 380 + Math.random() * 200,
      delay: Math.random() * 70,
      color,
      x: originX,
      y: originY,
    };
  });
}

export function ModeToggle({ mode, onSwitch, compact = false }: ModeToggleProps): JSX.Element {
  const toggleRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<HTMLElement[]>([]);
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function handleClick(destMode: AppMode) {
    if (destMode === mode) return;

    if (!prefersReducedMotion && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      const count = compact ? 8 : 14;
      const sparks = generateSparks(destMode, count, rect);

      sparks.forEach((spark) => {
        const el = document.createElement('div');
        el.className = 'sb-mode-toggle-spark';
        el.style.cssText = `
          left: ${spark.x}px;
          top:  ${spark.y}px;
          background: ${spark.color};
          --spark-dx: ${spark.dx}px;
          --spark-dy: ${spark.dy}px;
          --spark-duration: ${spark.duration}ms;
          animation-delay: ${spark.delay}ms;
          position: fixed;
        `;
        document.body.appendChild(el);
        sparksRef.current.push(el);
        setTimeout(
          () => {
            el.remove();
            sparksRef.current = sparksRef.current.filter((s) => s !== el);
          },
          spark.duration + spark.delay + 50,
        );
      });
    }

    onSwitch(destMode);
  }

  const cls = [
    'sb-mode-toggle',
    mode === 'play' ? 'is-game' : 'is-setup',
    compact ? 'is-compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={toggleRef}
      class={cls}
      data-testid="mode-toggle"
      role="group"
      aria-label="Mode toggle"
    >
      <div
        class="sb-mode-toggle-half"
        data-testid="mode-toggle-setup"
        role="button"
        aria-pressed={mode === 'edit'}
        tabIndex={0}
        onClick={() => handleClick('edit')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick('edit');
        }}
      >
        SETUP
      </div>
      <div class="sb-mode-toggle-sep" aria-hidden="true" />
      <div
        class="sb-mode-toggle-half"
        data-testid="mode-toggle-game"
        role="button"
        aria-pressed={mode === 'play'}
        tabIndex={0}
        onClick={() => handleClick('play')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick('play');
        }}
      >
        GAME
      </div>
    </div>
  );
}
