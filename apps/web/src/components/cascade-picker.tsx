import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface CascadeOption {
  value: string;
  label: string;
  description?: string;
  accent?: string;
}

/**
 * Full-screen selector. Options cascade in order. Typing reorders matches to
 * the front with a soft highlight; nothing is removed from the field.
 */
export function CascadePicker({
  label,
  title,
  placeholder,
  value,
  options,
  onChange,
  disabled,
  waitingLabel,
}: {
  label: string;
  title: string;
  placeholder: string;
  value: string;
  options: CascadeOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  waitingLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="field">
      <span>{label}</span>
      <button
        type="button"
        className="cascade-trigger"
        data-testid={`cascade-trigger-${label.toLowerCase().replace(/\s+/g, "-")}`}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${selected ? selected.label : disabled && waitingLabel ? waitingLabel : placeholder}`}
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
      >
        <span className={selected ? "cascade-trigger__value" : "cascade-trigger__placeholder"}>
          {selected ? selected.label : disabled && waitingLabel ? waitingLabel : placeholder}
        </span>
        <span className="cascade-trigger__chevron" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <CascadeOverlay
          title={title}
          placeholder={placeholder}
          options={options}
          value={value}
          onClose={() => setOpen(false)}
          onChange={(next) => {
            onChange(next);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CascadeOverlay({
  title,
  placeholder,
  options,
  value,
  onClose,
  onChange,
}: {
  title: string;
  placeholder: string;
  options: CascadeOption[];
  value: string;
  onClose: () => void;
  onChange: (value: string) => void;
}) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const firstCardRef = useRef<HTMLButtonElement>(null);
  const matchRef = useRef("");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);

  const ranked = useMemo(() => rankOptions(options, query), [options, query]);
  const matchValue = ranked[0]?.matched ? ranked[0].value : "";
  matchRef.current = matchValue;

  useEffect(() => {
    const previously = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => {
      setReady(true);
      inputRef.current?.focus();
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Enter" && matchRef.current) {
        event.preventDefault();
        onChange(matchRef.current);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [onClose, onChange]);

  // Keep the leading card in view while typing. Leave keyboard focus in the
  // search field so the visitor can keep typing without interruption.
  useEffect(() => {
    if (!query.trim()) return;
    const frame = window.requestAnimationFrame(() => {
      const card = firstCardRef.current;
      if (card && typeof card.scrollIntoView === "function") {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [query, ranked[0]?.value]);

  // Portal to body so parent transform/backdrop-filter cannot pin the dialog
  // to the trigger button. Fixed positioning must be viewport-rooted.
  return createPortal(
    <div className="cascade-overlay" role="presentation">
      <button
        type="button"
        className="cascade-overlay__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`cascade-overlay__panel ${ready ? "is-ready" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="cascade-overlay__chrome">
          <div>
            <p className="section-kicker">{title}</p>
            <h2 id={titleId} className="mt-2 font-serif text-3xl md:text-4xl">
              {title}
            </h2>
          </div>
          <button type="button" className="btn-quiet" onClick={onClose}>
            ×
          </button>
        </div>

        <label className="cascade-search">
          <span className="sr-only">{placeholder}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="cascade-grid" role="listbox" aria-label={title}>
          {ranked.map((option, index) => {
            const highlighted = Boolean(query.trim()) && option.matched && index === 0;
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                ref={index === 0 ? firstCardRef : undefined}
                type="button"
                role="option"
                aria-selected={selected || highlighted}
                className={[
                  "cascade-card",
                  ready ? "is-visible" : "",
                  highlighted ? "is-match" : "",
                  selected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  ["--cascade-delay" as string]: `${Math.min(index, 18) * 55}ms`,
                  ["--cascade-accent" as string]: option.accent ?? "var(--accent)",
                }}
                onClick={() => onChange(option.value)}
              >
                <span
                  className="cascade-card__swatch"
                  style={{ background: option.accent ?? "var(--accent)" }}
                />
                <strong>{option.label}</strong>
                {option.description ? <span>{option.description}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function rankOptions(options: CascadeOption[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return options.map((option) => ({ ...option, matched: false, score: 0 }));
  }
  return [...options]
    .map((option) => {
      const label = option.label.toLowerCase();
      const description = (option.description ?? "").toLowerCase();
      let score = 0;
      if (label.startsWith(needle)) score += 300;
      else if (label.includes(needle)) score += 180;
      if (description.includes(needle)) score += 40;
      const words = label.split(/\s+/);
      if (words.some((word) => word.startsWith(needle))) score += 80;
      return { ...option, matched: score > 0, score };
    })
    .sort((a, b) => {
      if (a.matched !== b.matched) return a.matched ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label);
    });
}
