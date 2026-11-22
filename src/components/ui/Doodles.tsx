import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Hand-drawn separators and illustrations.
 *
 * Everything here is vector + `currentColor`, so the sketches follow the theme
 * palette and stay crisp at any size. Strokes stay thin and irregular instead of
 * using gradients or heavy shapes.
 */

/** Wavy pencil separator used instead of a conventional horizontal rule. */
export function SketchRule({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 8"
      preserveAspectRatio="none"
      fill="none"
      className={cn('h-2 w-full text-line-strong', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 4.4c22-1.5 44 1.4 66 0C89 3 111 5.4 133 4.2c22-1.2 44 1.6 66 .3 22-1.3 44 1.3 66 .2 11-.5 22-.4 33 .1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Dashed pencil rule for quieter secondary breaks. */
export function SketchRuleDashed({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 8"
      preserveAspectRatio="none"
      fill="none"
      className={cn('h-2 w-full text-line-strong', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 4.2c24-1.2 48 1.2 72 0C97 3 121 5.2 145 4c24-1.2 48 1.4 72 .2 27-1.3 54 1 81 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeDasharray="5 7"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Squiggly underline that marks a key word without a highlighter block. */
export function SquiggleUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-2.5 w-auto text-brand', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M2 9.5C24.5 3 48.5 13.5 71 8C93.5 2.5 117.5 12.5 140 7C153 3.8 167 6.5 178 7.5"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hero sketch: a paper plane leaving a hand-drawn orbit. It communicates
 * "this opens Telegram" without adding copy.
 */
export function TelegramSketch({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 230"
      fill="none"
      className={cn('h-auto w-full text-brand', className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* soft blue wash */}
      <path
        d="M52 118C44 72 84 30 136 26c50-4 92 22 98 66 6 46-30 88-82 100-51 12-94-19-100-74Z"
        fill="currentColor"
        fillOpacity="0.09"
      />
      {/* wobbly orbit */}
      <path
        d="M28 154C10 122 26 78 66 54c42-25 100-30 142-3 38 25 44 71 18 103-27 33-84 46-132 37-36-7-56-19-66-37Z"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1.6"
        strokeDasharray="7 9"
        strokeLinecap="round"
      />
      {/* dotted route */}
      <path
        d="M36 186c26-6 48-19 66-39 8-9 14-19 20-30"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="2 7"
      />
      <path
        d="M114 112c1.9-3 4.3-5.2 7.4-6.6"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* paper plane */}
      <g>
        <path
          d="M231 40 132 105l-2 33 20-19 30 22 51-101Z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M130 138 231 40l-51 101"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M132 105l28 17"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* little sparkles */}
      <path
        d="M60 44c.5 5.4 2.6 7.6 8 8-5.4.5-7.5 2.6-8 8-.5-5.4-2.6-7.5-8-8 5.4-.4 7.5-2.6 8-8Z"
        fill="currentColor"
        fillOpacity="0.55"
      />
      <path
        d="M206 158c.4 4 2 5.7 6 6-4 .4-5.6 2-6 6-.4-4-2-5.6-6-6 4-.3 5.6-2 6-6Z"
        fill="currentColor"
        fillOpacity="0.4"
      />
      <circle cx="196" cy="30" r="2.4" fill="currentColor" fillOpacity="0.45" />
      <circle cx="46" cy="120" r="2" fill="currentColor" fillOpacity="0.35" />
    </svg>
  );
}

/** Curved hand-drawn arrow, useful for pointing at the primary action. */
export function HandDrawnArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-auto text-muted', className)}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 4C18 12 24 24 18 38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 32L18 39L25 33"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Organic sketch circle used around numbers and small labels. */
export function SketchCircle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('relative inline-flex items-center justify-center px-2 py-0.5', className)}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 size-full text-line-strong"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M6 20C5 10 16 5 50 4C84 3 95 9 94 20C93 31 82 36 50 36C18 36 7 30 6 20Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/**
 * Very light page texture: a dotted arc and two pencil strokes. Kept under 5%
 * opacity so it never competes with content or harms contrast.
 */
export function HandDrawnBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none opacity-[0.05] dark:opacity-[0.09] text-ink transition-opacity duration-300',
        className,
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
      >
        <path
          d="M-60 210C160 150 330 280 590 190C850 100 1110 260 1500 160"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="5 10"
        />
        <path
          d="M-40 720C200 660 430 790 760 700C1090 610 1300 760 1520 690"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <g opacity="0.75">
          <line x1="1330" y1="50" x2="1420" y2="140" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="1354" y1="44" x2="1438" y2="128" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <g opacity="0.6">
          <line x1="30" y1="800" x2="110" y2="880" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="54" y1="794" x2="128" y2="868" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
