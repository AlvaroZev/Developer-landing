interface TriunderMarkProps {
  size?: number;
  className?: string;
  /** Animate facet strokes on first paint */
  animated?: boolean;
}

/**
 * Official Triunder mark: inverted triangular / Pyraminx-inspired geometry
 * with an integrated balance-scales motif. Prefer this component over emoji
 * or ad-hoc icons.
 */
export function TriunderMark({ size = 40, className, animated = false }: TriunderMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Triunder"
    >
      <path fill="var(--tri-primary)" d="M64 118 L10 22 H118 Z" />
      <path
        fill="none"
        stroke="var(--tri-accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray={animated ? 240 : undefined}
        className={animated ? "animate-[draw-mark_1.2s_ease_forwards]" : undefined}
        d="M64 118 L10 22 H118 Z M64 118 L64 22 M37 52 H91 M50.5 76 H77.5"
      />
      <path
        fill="none"
        stroke="var(--tri-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        d="M28 52 H100 M28 52 L22 64 M100 52 L106 64"
      />
      <circle cx="64" cy="52" r="4" fill="var(--tri-accent)" />
      <circle cx="64" cy="76" r="3" fill="var(--tri-bg)" />
    </svg>
  );
}

export function TriunderWordmark({ className }: { className?: string }) {
  return (
    <span
      className={`text-base font-semibold tracking-[-0.03em] ${className ?? ""}`}
      style={{ color: "var(--tri-text)" }}
    >
      Triunder
    </span>
  );
}
