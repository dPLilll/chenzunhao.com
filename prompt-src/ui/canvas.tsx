import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";

export { useEffect, useState };
export type { ChangeEvent };

/**
 * Light/system stand-in for grok/canvas primitives.
 * Colors are CSS variables so the page follows the visitor's color scheme.
 * Prompt text is rendered by the original app, not by this file.
 */
const theme = {
  border: { default: "var(--line)", strong: "var(--ink)" },
  radius: { lg: 12, md: 8, full: 999 },
  text: { primary: "var(--ink)", tertiary: "var(--muted)" },
  font: {
    family: "inherit",
    body2: { fontSize: 15, lineHeight: 1.65 },
    label: { fontSize: 13, lineHeight: 1.45 },
  },
  fill: { secondary: "var(--chip)" },
};

export function useGrokTheme() {
  return theme;
}

export function Page({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  lang?: string;
  width?: string;
  children?: ReactNode;
}) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <main className="tool">
      <h1>{title}</h1>
      {summary ? <p className="summary">{summary}</p> : null}
      {children}
    </main>
  );
}

export function Section({
  heading,
  id,
  collapsible,
  defaultOpen = true,
  children,
}: {
  heading: string;
  id?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (collapsible) {
    return (
      <section className="block" id={id}>
        <button
          type="button"
          className="fold"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <h2>{heading}</h2>
          <span aria-hidden="true">{open ? "收起" : "展开"}</span>
        </button>
        {open ? <div className="block-body">{children}</div> : null}
      </section>
    );
  }
  return (
    <section className="block" id={id}>
      <h2>{heading}</h2>
      <div className="block-body">{children}</div>
    </section>
  );
}

export function Text({ children }: { children?: ReactNode }) {
  return <p className="prose">{children}</p>;
}

export function Callout({
  lead,
  children,
}: {
  tone?: string;
  lead?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="callout">
      {lead ? <strong>{lead}</strong> : null}
      <div>{children}</div>
    </aside>
  );
}

export function Button({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: string;
}) {
  return (
    <button
      type="button"
      className={variant === "primary" ? "btn primary" : "btn"}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function Divider() {
  return <hr className="rule" />;
}

export function NumberedList({ items }: { items: { text: string }[] }) {
  return (
    <ol className="steps">
      {items.map((item, i) => (
        <li key={i}>{item.text}</li>
      ))}
    </ol>
  );
}

export function Properties({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <dl className="props">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: string[][];
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TableOfContents({
  items,
}: {
  items: { label: string; id: string }[];
}) {
  return (
    <nav className="toc" aria-label="页内目录">
      {items.map((item) => (
        <a key={item.id} href={"#" + item.id}>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
