/** Inverted triangular mark. The beam and pans are part of the geometry, not a separate icon. */
export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 54 10 14h44L32 54Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M32 54V30" stroke="currentColor" strokeWidth="1.2" />
      <path d="M17.5 28h29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 28.2 29.2 33.4h5.6L32 28.2Z" fill="currentColor" />
      <path d="M21 28v4.2M43 28v4.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16.6 32.4h8.8M38.6 32.4h8.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16.8 32.6c1.6 2.6 7 2.6 8.6 0M38.6 32.6c1.6 2.6 7 2.6 8.6 0"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <Mark />
      <span>Triunder</span>
    </span>
  );
}
