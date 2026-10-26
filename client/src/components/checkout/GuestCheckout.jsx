"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const inputCls =
  "w-full min-h-[48px] rounded-xl border border-[#DDD6C0] bg-white px-4 text-[15px] text-[#12213F] outline-none transition focus:border-[#12213F] focus:ring-4 focus:ring-[#12213F]/10";

export default function GuestCheckout({ signInRedirect = "/checkout" }) {
  const { guestStart, guestVerify } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [code, setCode] = useState("");
  const [step, setStep] = useState("details"); // details | code
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const start = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await guestStart({ ...form, email: form.email.trim() });
      if (res?.needsCode) {
        setStep("code");
        setInfo(`A new code was sent to ${form.email.trim()}. Check spam too.`);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await guestVerify(form.email.trim(), code.trim());
    } catch (err) {
      setError(err.message || "That code did not work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-[#FAF8F2] px-4 py-14">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#E6DFC9] bg-white p-6 shadow-[0_30px_60px_-44px_#12213F88] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8741F]">Checkout</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#12213F]">
          {step === "details" ? "Who is this order for?" : "Check your email"}
        </h1>
        <p className="mt-2 text-sm text-[#4A5470]">
          {step === "details"
            ? "No password needed. We save your details so your next order is faster."
            : `We sent a 6 digit code to ${form.email}. This email already has an account, so we just need to confirm it is you.`}
        </p>

        {info && !error && <p role="status" className="mt-4 rounded-xl border border-[#A8741F]/30 bg-[#FBF5E6] px-4 py-3 text-sm text-[#12213F]">{info}</p>}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-[#B3001B]/30 bg-[#B3001B]/5 px-4 py-3 text-sm text-[#B3001B]">
            {error}
          </p>
        )}

        {step === "details" ? (
          <form onSubmit={start} className="mt-5 space-y-3">
            <input className={inputCls} placeholder="Full name" autoComplete="name" value={form.name} onChange={set("name")} />
            <input className={inputCls} type="email" placeholder="Email" autoComplete="email" required value={form.email} onChange={set("email")} />
            <input className={inputCls} type="tel" placeholder="US phone, e.g. (562) 524-3557" autoComplete="tel" value={form.phone} onChange={set("phone")} />
            <button disabled={busy} className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#12213F] text-sm font-semibold text-white transition hover:bg-[#B3001B] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue to checkout
            </button>
            <p className="text-center text-xs text-[#6B7388]">
              Already have a password? <Link href={`/auth?redirect=${encodeURIComponent(signInRedirect)}`} className="font-semibold text-[#12213F] underline underline-offset-4">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-5 space-y-3">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7388]" />
              <input
                className={`${inputCls} pl-11 tracking-[0.4em]`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>
            <button disabled={busy || code.length !== 6} className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#12213F] text-sm font-semibold text-white transition hover:bg-[#B3001B] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Confirm and continue
            </button>
            <div className="flex justify-between text-xs text-[#6B7388]">
              <button type="button" onClick={() => { setStep("details"); setCode(""); setError(""); }} className="underline underline-offset-4">Use a different email</button>
              <button type="button" disabled={busy} onClick={start} className="underline underline-offset-4">Send a new code</button>
            </div>
          </form>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[#6B7388]">
          <ShieldCheck className="h-4 w-4 text-[#A8741F]" /> Secure payment with Stripe
        </p>
      </div>
    </div>
  );
}
