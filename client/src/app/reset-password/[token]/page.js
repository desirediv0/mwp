"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { IconLock, IconArrowRight, IconCircleCheck } from "@tabler/icons-react";
import { AuthShell, Alert, PasswordField, PasswordStrength, SubmitButton, passwordChecks } from "@/components/auth/AuthUI";

export default function ResetPasswordPage() {
  const params = useParams();
  const token = Array.isArray(params?.token) ? params.token[0] : params?.token;
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [expired, setExpired] = useState(false);
  const [done, setDone] = useState(false);

  const errors = {
    password:
      password.length < 8 ? "Use at least 8 characters" : !(passwordChecks(password)[1].ok && passwordChecks(password)[2].ok) ? "Add upper and lower case letters and a number" : "",
    confirm: !confirm ? "Confirm your new password" : confirm !== password ? "The passwords do not match" : "",
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setTouched({ password: true, confirm: true });
    if (errors.password || errors.confirm) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const msg = err?.message || "We could not reset your password.";
      if (/expire|invalid|token|link/i.test(msg)) setExpired(true);
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        eyebrow="All set"
        title="Password updated"
        subtitle="Your password was changed. Sign in with your new password to continue."
        side={{ headline: "You are back in.", text: "Your account is safe and ready to use." }}
      >
        <div className="space-y-5">
          <div className="grid place-items-center rounded-2xl bg-[#EAF7EF] py-7 text-[#1F8A4C]">
            <IconCircleCheck size={48} stroke={1.3} />
          </div>
          <Link href="/auth?tab=login" className="flex h-[54px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#12213F] text-[14px] font-semibold text-white transition-colors hover:bg-[#B3001B]">
            Go to sign in <IconArrowRight size={18} stroke={1.8} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Pick something strong that you do not use anywhere else."
      side={{ headline: "Fresh start.", text: "Choose a new password and you can sign in right away." }}
      backHref="/auth?tab=login"
      backLabel="Back to sign in"
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        {formError && (
          <Alert
            type="error"
            action={expired && <Link href="/forgot-password" className="font-semibold underline underline-offset-4">Request a new reset link</Link>}
          >
            {expired ? "This reset link is invalid or has expired. Reset links work once and for 1 hour." : formError}
          </Alert>
        )}

        <div>
          <PasswordField
            label="New password"
            icon={IconLock}
            autoComplete="new-password"
            placeholder="Create a new password"
            value={password}
            disabled={submitting || expired}
            onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            error={touched.password ? errors.password : ""}
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordField
          label="Confirm new password"
          icon={IconLock}
          autoComplete="new-password"
          placeholder="Repeat the password"
          value={confirm}
          disabled={submitting || expired}
          onChange={(e) => { setConfirm(e.target.value); setFormError(""); }}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          error={touched.confirm ? errors.confirm : ""}
        />

        <SubmitButton loading={submitting} disabled={expired} loadingText="Updating your password...">
          Update password <IconArrowRight size={18} stroke={1.8} />
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
