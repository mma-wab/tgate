import { cn } from '../../lib/cn';

/**
 * Hand-drawn squiggly underline doodle to highlight key words.
 */
export function SquiggleUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-2.5 w-auto text-brand', className)}
      aria-hidden="true"
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
 * Playful hand-drawn sketch paper airplane with gentle dashed motion trails.
 */
export function PaperPlaneDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-12 text-brand', className)}
      aria-hidden="true"
    >
      {/* Wind trail dots/dashes */}
      <path
        d="M6 46C12 43 18 45 22 40"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 4"
        opacity="0.55"
      />
      <path
        d="M10 54C16 51 22 52 26 48"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 4"
        opacity="0.4"
      />
      {/* Hand-drawn paper plane body */}
      <path
        d="M58 8L18 34L32 40L36 54L43 43L58 8Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Fold crease */}
      <path
        d="M32 40L58 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wing detail */}
      <path
        d="M18 34L43 43"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
    </svg>
  );
}

/**
 * Hand-drawn sparkle / 4-point doodle star.
 */
export function SparkleDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-5 text-amber-400', className)}
      aria-hidden="true"
    >
      <path
        d="M12 2C12.4 7.2 14.8 9.6 20 10C14.8 10.4 12.4 12.8 12 18C11.6 12.8 9.2 10.4 4 10C9.2 9.6 11.6 7.2 12 2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Curved hand-drawn arrow pointing downwards.
 */
export function HandDrawnArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-10 w-auto text-muted', className)}
      aria-hidden="true"
    >
      <path
        d="M10 4C18 12 24 24 18 38"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 32L18 39L25 33"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Organic sketch badge / circle highlight.
 */
export function SketchCircle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('relative inline-flex items-center justify-center px-2 py-0.5', className)}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 size-full text-brand/35"
        aria-hidden="true"
      >
        <path
          d="M6 20C5 10 16 5 50 4C84 3 95 9 94 20C93 31 82 36 50 36C18 36 7 30 6 20Z"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="95 5"
        />
      </svg>
      {children}
    </span>
  );
}

/**
 * Subtle hand-drawn background sketch lines, curves, and light hatching
 * that give a handcrafted notebook/editorial charm without visual noise.
 */
export function HandDrawnBackground({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none opacity-[0.04] dark:opacity-[0.07] text-ink dark:text-brand transition-opacity duration-300',
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
        {/* Soft flowing sketch contour line 1 */}
        <path
          d="M-80 180C140 120 320 260 580 160C840 60 1100 240 1520 130"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
        />

        {/* Soft flowing sketch contour line 2 */}
        <path
          d="M-40 450C220 380 480 520 800 420C1120 320 1340 480 1560 390"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Soft flowing sketch contour line 3 */}
        <path
          d="M-60 760C180 700 420 840 740 750C1060 660 1280 820 1540 730"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="8 10"
        />

        {/* Subtle corner hatching / sketch strokes (Top Right) */}
        <g opacity="0.8">
          <line x1="1320" y1="40" x2="1420" y2="140" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1345" y1="35" x2="1435" y2="125" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="1370" y1="30" x2="1450" y2="110" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Subtle corner hatching / sketch strokes (Bottom Left) */}
        <g opacity="0.8">
          <line x1="20" y1="780" x2="120" y2="880" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="45" y1="775" x2="135" y2="865" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="70" y1="770" x2="150" y2="850" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
