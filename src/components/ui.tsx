import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xs px-3 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85",
  secondary: "border border-rule-strong bg-panel text-ink hover:border-ink",
  ghost: "text-ink-2 hover:bg-sunk hover:text-ink",
  danger: "border border-rule-strong bg-panel text-rec hover:border-rec hover:bg-rec-soft",
};

export function buttonClass(variant: Variant = "secondary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "secondary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export const inputBase =
  "block rounded-xs border border-rule-strong bg-panel px-2.5 py-1.5 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none disabled:bg-sunk disabled:text-ink-2";

export const inputClass = `${inputBase} w-full`;

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-4">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-ink-2">
        {children}
      </label>
      {hint ? <span className="font-mono text-[11px] text-ink-3">{hint}</span> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-rule px-6 pb-5 pt-7 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{eyebrow}</div> : null}
          <h1 className="truncate text-[22px] font-semibold tracking-[-0.01em]">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

export function Section({
  index,
  title,
  aside,
  children,
  muted = false,
}: {
  index?: string;
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section className={`border-b border-rule py-6 ${muted ? "opacity-55" : ""}`}>
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="flex items-baseline gap-3 text-[13px] font-semibold uppercase tracking-[0.06em]">
          {index ? <span className="font-mono text-[11px] font-normal text-ink-3">{index}</span> : null}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Notice({
  tone = "neutral",
  title,
  children,
  action,
}: {
  tone?: "neutral" | "error" | "warn" | "ok";
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const tones = {
    neutral: "border-rule-strong bg-panel",
    error: "border-rec bg-rec-soft",
    warn: "border-amber bg-amber-soft",
    ok: "border-ok bg-ok-soft",
  };
  const bars = { neutral: "bg-ink-3", error: "bg-rec", warn: "bg-amber", ok: "bg-ok" };

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`relative flex gap-4 border py-3 pl-4 pr-3 ${tones[tone]}`}>
      <span className={`absolute inset-y-0 left-0 w-[3px] ${bars[tone]}`} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-0.5 text-[13px] text-ink-2">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export function LoadError({ error, what }: { error: string; what: string }) {
  return (
    <div className="px-6 py-10 lg:px-10">
      <Notice tone="error" title={`Gagal memuat ${what}`}>
        <span className="font-mono text-[12px]">{error}</span>
      </Notice>
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 border-l border-rule pl-4 first:border-l-0 first:pl-0">
      <div className="text-[12px] text-ink-2">{label}</div>
      <div className="mt-1 truncate font-mono text-[20px] font-medium tracking-[-0.02em]">{value}</div>
      {sub ? <div className="mt-0.5 font-mono text-[11px] text-ink-3">{sub}</div> : null}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-3 animate-spin rounded-full border-[1.5px] border-current border-r-transparent ${className}`}
    />
  );
}
