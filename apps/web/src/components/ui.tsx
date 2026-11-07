import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {hint ? <em className="ml-2 font-normal text-[var(--muted)] not-italic">{hint}</em> : null}
      </span>
      {children}
      {error ? <small>{error}</small> : null}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = ref.current;
    const previously = document.activeElement as HTMLElement | null;
    node?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="panel max-h-[90dvh] w-full max-w-lg overflow-auto p-5"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-2xl">
            {title}
          </h2>
          <button type="button" className="btn-quiet" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export interface ComboOption {
  value: string;
  label: string;
  description?: string;
}

export function Combo({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  empty,
}: {
  label: string;
  placeholder: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  empty: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => {
    const haystack = `${option.label} ${option.description ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  function choose(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="field relative">
      <span id={`${id}-label`}>{label}</span>
      <input
        id={id}
        className="combo-input"
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open && filtered[active] ? `${id}-opt-${filtered[active].value}` : undefined
        }
        aria-autocomplete="list"
        placeholder={selected && !open ? selected.label : placeholder}
        value={open ? query : (selected?.label ?? "")}
        disabled={disabled}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter" && open && filtered[active]) {
            event.preventDefault();
            choose(filtered[active].value);
          } else if (event.key === "Escape") setOpen(false);
        }}
      />
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          className="panel absolute z-20 mt-1 max-h-64 w-full overflow-auto p-1"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-[var(--muted)]">{empty}</li>
          ) : null}
          {filtered.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-opt-${option.value}`}
              role="option"
              aria-selected={option.value === value}
              className={`cursor-pointer rounded-lg px-3 py-2 ${index === active ? "bg-[var(--secondary)]" : ""}`}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option.value);
              }}
            >
              <strong className="block">{option.label}</strong>
              {option.description ? (
                <span className="text-sm text-[var(--muted)]">{option.description}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
