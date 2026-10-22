"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { IconMail, IconArrowRight, IconRefresh, IconLoader2 } from "@tabler/icons-react";
import { AuthShell, Alert, Field, SubmitButton, isEmail, maskEmail } from "@/components/auth/AuthUI";

const LENGTH = 6;
const COOLDOWN = 60;

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyOtp, resendVerification } = useAuth();

  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState("");
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputs = useRef([]);

  useEffect(() => setEmail(initialEmail), [initialEmail]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => {
    if (initialEmail) inputs.current[0]?.focus();
  }, [initialEmail]);

  const code = digits.join("");
  const hasEmail = isEmail(email);
  const emailLocked = Boolean(initialEmail) && hasEmail;

  const setAt = (index, value) => setDigits((d) => d.map((x, i) => (i === index ? value : x)));

  const onChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setAt(index, digit);
    setError("");
    if (digit && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };
  const onKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      setAt(index - 1, "");
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  };
  const onPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits(Array.from({ length: LENGTH }, (_, i) => pasted[i] || ""));
    setError("");
    inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  };

  const submit = async (e) => {
    e?.preventDefault();
    setNotice("");
    if (!hasEmail) return setEmailError("Enter the email address you registered with");
    if (code.length < LENGTH) return setError(`Enter all ${LENGTH} digits of the code`);
    setError("");
    setSubmitting(true);
    try {
      await verifyOtp(email.trim(), code);
      setVerified(true);
      toast.success("Email verified. Welcome to MWP!");
      setTimeout(() => router.push("/account"), 900);
    } catch (err) {
      setError(err?.message || "That code did not work. Check it and try again, or request a new one.");
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!hasEmail) return setEmailError("Enter your email address first");
    setError("");
    setNotice("");
    setResending(true);
    try {
      await resendVerification(email.trim());
      setCooldown(COOLDOWN);
      setNotice("A new code is on its way. It stays valid for 10 minutes.");
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || "We could not send a new code. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verify your email"
      title="Enter your code"
      subtitle={hasEmail ? `We sent a ${LENGTH}-digit code to ${maskEmail(email)}. It is valid for 10 minutes.` : "Enter your email and the 6-digit code we sent you."}
      side={{ headline: "One quick step.", text: "Confirm your email to protect your account and receive order updates." }}
      backHref="/auth?tab=register"
      backLabel="Back to register"
      footer={<>Already verified? <Link href="/auth?tab=login" className="font-semibold text-[#12213F] underline underline-offset-4 hover:text-[#B3001B]">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {error && <Alert type="error">{error}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}

        {!emailLocked && (
          <Field
            label="Email"
            icon={IconMail}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            disabled={submitting || verified}
            onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
            error={emailError}
          />
        )}

        <fieldset disabled={submitting || verified}>
          <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A5470]">Verification code</legend>
          <div className="flex justify-between gap-2 sm:gap-3" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                value={d}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={error ? "true" : undefined}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`h-14 w-full min-w-0 rounded-xl border bg-white text-center text-2xl font-semibold text-[#12213F] outline-none transition-all disabled:bg-[#F3F4F7] sm:h-16 ${
                  error ? "border-[#D8434F] bg-[#FFF8F8]" : d ? "border-[#12213F]" : "border-[#D9D3BF]"
                } focus:border-[#A8741F] focus:ring-4 focus:ring-[#D4A437]/25`}
              />
            ))}
          </div>
        </fieldset>

        <SubmitButton loading={submitting || verified} loadingText={verified ? "Verified. Signing you in..." : "Checking the code..."} disabled={code.length < LENGTH}>
          Verify and continue <IconArrowRight size={18} stroke={1.8} />
        </SubmitButton>

        <div className="flex items-center justify-between gap-3 text-[13px] text-[#5A6275]">
          <span>Did not get a code?</span>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || resending || verified}
            className="inline-flex items-center gap-1.5 font-semibold text-[#12213F] transition-colors hover:text-[#B3001B] disabled:cursor-not-allowed disabled:text-[#9AA0B2] disabled:hover:text-[#9AA0B2]"
          >
            {resending ? <IconLoader2 size={15} className="animate-spin" /> : <IconRefresh size={15} stroke={1.8} />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend code"}
          </button>
        </div>
        <p className="text-center text-[12px] text-[#6B7388]">Check your spam folder too. The email comes from support@mwpsupplements.com.</p>
      </form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
}
