"use client";

import { useId, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconEye,
  IconEyeOff,
  IconInfoCircle,
  IconLoader2,
  IconArrowLeft,
  IconShieldCheck,
  IconTruckDelivery,
  IconPackage,
} from "@tabler/icons-react";

/* ------------------------------------------------------------------ Shell */

const DEFAULT_POINTS = [
  { Icon: IconPackage, text: "Track every order in one place" },
  { Icon: IconTruckDelivery, text: "Faster checkout with saved addresses" },
  { Icon: IconShieldCheck, text: "Your details stay private and secure" },
];

// Split screen used by sign in, register, forgot / reset password and OTP pages
export function AuthShell({ eyebrow, title, subtitle, side, backHref, backLabel, children, footer }) {
  const points = side?.points || DEFAULT_POINTS;
  return (
    <div className="mwp-auth-shell min-h-screen bg-[#FAF8F2] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0B1530] via-[#12213F] to-[#1B2D52] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#D4A437]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#B3001B]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute right-10 top-1/3 h-40 w-72 rotate-[-18deg] rounded-full border border-[#E6C26A]/20" />

        <Link href="/" className="relative z-10 inline-block" aria-label="MWP Supplements home">
          <Image src="/mwp-logo-3.png" alt="MWP Supplements" width={200} height={71} className="h-16 w-auto" priority />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E6C26A]">{side?.eyebrow || "Men · Women · Power"}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight xl:text-5xl">
            {side?.headline || "Your routine, in one place."}
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#CDD4E6]">
            {side?.text || "Create an account to save your details, track your orders and manage your addresses."}
          </p>
          <ul className="mt-8 space-y-3.5">
            {points.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-[#E3E7F2]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E6C26A]/40 bg-white/5 text-[#E6C26A]">
                  <Icon size={17} stroke={1.6} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] uppercase tracking-[0.2em] text-[#8F9ABB]">
          &copy; {new Date().getFullYear()} MWP Supplements LLC
        </p>
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen flex-col">
        {/* Mobile brand bar */}
        <div className="bg-gradient-to-r from-[#0B1530] to-[#1B2D52] px-5 py-4 lg:hidden">
          <Link href="/" className="inline-block" aria-label="MWP Supplements home">
            <Image src="/mwp-logo-3.png" alt="MWP Supplements" width={160} height={56} className="h-11 w-auto" priority />
          </Link>
        </div>

        <div className="flex flex-1 items-start justify-center px-5 py-10 sm:px-8 lg:items-center lg:py-14">
          <div className="w-full max-w-[440px]">
            {backHref && (
              <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-[13px] text-[#4A5470] transition-colors hover:text-[#12213F]">
                <IconArrowLeft size={16} stroke={1.6} /> {backLabel || "Back"}
              </Link>
            )}

            <div className="rounded-[1.75rem] border border-[#E6DFC9] bg-white p-6 shadow-[0_30px_60px_-44px_#12213F88] sm:p-8">
              {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8741F]">{eyebrow}</p>}
              <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-tight text-[#12213F] sm:text-[32px]">{title}</h1>
              {subtitle && <p className="mt-2 text-[14px] leading-relaxed text-[#5A6275]">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>

            {footer && <div className="mt-6 text-center text-[13px] text-[#5A6275]">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ Alert */

const ALERT_STYLES = {
  error: { box: "border-[#F0C9CE] bg-[#FBEAEC] text-[#8C0016]", Icon: IconAlertCircle },
  success: { box: "border-[#BFE3CC] bg-[#EAF7EF] text-[#155D34]", Icon: IconCircleCheck },
  info: { box: "border-[#D6DCEC] bg-[#EEF1F8] text-[#12213F]", Icon: IconInfoCircle },
  warning: { box: "border-[#EADFC4] bg-[#FBF3DF] text-[#7A5214]", Icon: IconAlertCircle },
};

export function Alert({ type = "error", children, action, className = "" }) {
  if (!children) return null;
  const { box, Icon } = ALERT_STYLES[type] || ALERT_STYLES.error;
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed ${box} ${className}`}>
      <Icon size={18} stroke={1.8} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div>{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Field */

export function Field({ label, icon: Icon, error, hint, right, type = "text", className = "", inputClassName = "", ...props }) {
  const uid = useId();
  const id = props.id || uid;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A5470]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && <Icon size={18} stroke={1.5} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7388]" />}
        <input
          id={id}
          type={type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          className={`h-[52px] w-full rounded-xl border bg-white text-[15px] text-[#12213F] outline-none transition-all placeholder:text-[#8A90A3] disabled:cursor-not-allowed disabled:bg-[#F3F4F7] disabled:text-[#8A90A3] ${
            Icon ? "pl-12" : "pl-4"
          } ${right ? "pr-12" : "pr-4"} ${
            error
              ? "border-[#D8434F] bg-[#FFF8F8] focus:border-[#B3001B] focus:ring-4 focus:ring-[#B3001B]/10"
              : "border-[#D9D3BF] focus:border-[#12213F] focus:ring-4 focus:ring-[#12213F]/10"
          } ${inputClassName}`}
          {...props}
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#B3001B]">
          <IconAlertCircle size={14} stroke={2} /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] text-[#6B7388]">{hint}</p>
      ) : null}
    </div>
  );
}

export function PasswordField({ label = "Password", error, hint, labelRight, ...props }) {
  const [show, setShow] = useState(false);
  const Icon = show ? IconEyeOff : IconEye;
  return (
    <div>
      {labelRight && <div className="mb-1.5 flex justify-end text-[12px]">{labelRight}</div>}
      <Field
        label={label}
        type={show ? "text" : "password"}
        error={error}
        hint={hint}
        right={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="grid h-9 w-9 place-items-center rounded-lg text-[#5A6275] transition-colors hover:bg-[#F3EEDF] hover:text-[#12213F]"
          >
            <Icon size={18} stroke={1.6} />
          </button>
        }
        {...props}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ Button */

export function SubmitButton({ loading, disabled, children, loadingText, className = "", ...props }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      className={`flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#12213F] text-[14px] font-semibold tracking-wide text-white shadow-[0_16px_30px_-18px_#12213F] transition-all hover:bg-[#B3001B] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#C9CDD8] disabled:shadow-none ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <IconLoader2 size={18} className="animate-spin" stroke={1.8} /> {loadingText || "Please wait..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ Password strength */

export const passwordChecks = (pw = "") => [
  { ok: pw.length >= 8, text: "At least 8 characters" },
  { ok: /[a-z]/.test(pw) && /[A-Z]/.test(pw), text: "Upper and lower case letters" },
  { ok: /\d/.test(pw), text: "A number" },
  { ok: /[^a-zA-Z0-9]/.test(pw), text: "A symbol (optional, but stronger)" },
];

export function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = passwordChecks(password);
  const score = checks.filter((c) => c.ok).length;
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  const color = ["", "#D8434F", "#E08A1E", "#A8741F", "#1F8A4C"][score];
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="h-1.5 flex-1 rounded-full bg-[#E6E8EE] transition-colors" style={i <= score ? { background: color } : undefined} />
          ))}
        </div>
        <span className="w-12 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
      <ul className="mt-2.5 grid gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.text} className={`flex items-center gap-1.5 text-[12px] ${c.ok ? "text-[#1F8A4C]" : "text-[#6B7388]"}`}>
            <IconCheck size={13} stroke={2.4} className={c.ok ? "opacity-100" : "opacity-30"} /> {c.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || "").trim());

export const maskEmail = (email = "") => {
  const [name, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = name.length <= 2 ? name[0] || "" : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
};
