"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { IconMail, IconArrowRight, IconMailForward } from "@tabler/icons-react";
import { AuthShell, Alert, Field, SubmitButton, isEmail } from "@/components/auth/AuthUI";

export default function ResendVerificationPage() {
  const router = useRouter();
  const { resendVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return setFieldError("Enter the email address you registered with");
    if (!isEmail(value)) return setFieldError("That does not look like an email address");
    setFieldError("");
    setFormError("");
    setSubmitting(true);
    try {
      await resendVerification(value);
      setSent(true);
      setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(value)}`), 1400);
    } catch (err) {
      setFormError(err?.message || "We could not send the code. Please try again in a moment.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verify your email"
      title={sent ? "Code sent" : "Send a new code"}
      subtitle={sent ? "Taking you to the code page..." : "Enter your email and we will send a fresh 6-digit code."}
      side={{ headline: "Lost your code?", text: "No problem. We will send a new one and you can finish verifying in a minute." }}
      backHref="/auth?tab=login"
      backLabel="Back to sign in"
      footer={<>Have a code already? <Link href="/verify-otp" className="font-semibold text-[#12213F] underline underline-offset-4 hover:text-[#B3001B]">Enter it here</Link></>}
    >
      {sent ? (
        <div className="space-y-5">
          <div className="grid place-items-center rounded-2xl bg-[#EAF7EF] py-7 text-[#1F8A4C]">
            <IconMailForward size={44} stroke={1.3} />
          </div>
          <Alert type="success">If this email has an unverified MWP account, a new code is on its way. It is valid for 10 minutes.</Alert>
        </div>
      ) : (
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
          <SubmitButton loading={submitting} loadingText="Sending the code...">
            Send the code <IconArrowRight size={18} stroke={1.8} />
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
