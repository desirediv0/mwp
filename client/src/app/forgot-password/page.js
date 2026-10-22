"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { IconMail, IconArrowRight, IconMailCheck, IconRefresh } from "@tabler/icons-react";
import { AuthShell, Alert, Field, SubmitButton, isEmail, maskEmail } from "@/components/auth/AuthUI";

const COOLDOWN = 60;

function ForgotPasswordForm() {
  const params = useSearchParams();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState(params.get("email") || "");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async (address) => {
    setFormError("");
    setSubmitting(true);
    try {
      await forgotPassword(address);
      setSentTo(address);
      setCooldown(COOLDOWN);
    } catch (err) {
      setFormError(err?.message || "We could not send the reset email. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return setFieldError("Enter the email address of your account");
    if (!isEmail(value)) return setFieldError("That does not look like an email address");
    setFieldError("");
    send(value);
  };

  if (sentTo) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link sent"
        subtitle={`If ${maskEmail(sentTo)} has an MWP account, a link to choose a new password is on its way. It stays valid for 1 hour.`}
        side={{ headline: "Almost there.", text: "Open the email, tap the button and choose a new password." }}
        backHref="/auth?tab=login"
        backLabel="Back to sign in"
      >
        <div className="space-y-5">
          <div className="grid place-items-center rounded-2xl bg-[#FBF5E6] py-7 text-[#A8741F]">
            <IconMailCheck size={44} stroke={1.3} />
          </div>
          {formError && <Alert type="error">{formError}</Alert>}
          <Alert type="info">Nothing yet? Check your spam or promotions folder, and make sure the address is spelled correctly.</Alert>
          <button
            type="button"
            disabled={cooldown > 0 || submitting}
            onClick={() => send(sentTo)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#12213F]/25 text-[14px] font-semibold text-[#12213F] transition-colors hover:border-[#A8741F] hover:text-[#A8741F] disabled:cursor-not-allowed disabled:border-[#E3E6EE] disabled:text-[#9AA0B2]"
          >
            <IconRefresh size={17} stroke={1.8} className={submitting ? "animate-spin" : ""} />
            {cooldown > 0 ? `Send again in ${cooldown}s` : submitting ? "Sending..." : "Send the email again"}
          </button>
          <button type="button" onClick={() => { setSentTo(""); setEmail(""); }} className="w-full text-center text-[13px] text-[#5A6275] underline underline-offset-4 hover:text-[#12213F]">
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      side={{ headline: "It happens to everyone.", text: "We will email you a secure link. You will be back in your account in a minute." }}
      backHref="/auth?tab=login"
      backLabel="Back to sign in"
      footer={<>Remembered it? <Link href="/auth?tab=login" className="font-semibold text-[#12213F] underline underline-offset-4 hover:text-[#B3001B]">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && <Alert type="error">{formError}</Alert>}
        <Field
          label="Email"
          icon={IconMail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          disabled={submitting}
          onChange={(e) => { setEmail(e.target.value); setFieldError(""); setFormError(""); }}
          error={fieldError}
        />
        <SubmitButton loading={submitting} loadingText="Sending the link...">
          Email me the reset link <IconArrowRight size={18} stroke={1.8} />
        </SubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
