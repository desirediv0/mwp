"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { formatUsPhone, isValidUsPhone } from "@/lib/us";
import { IconMail, IconUser, IconPhone, IconArrowRight, IconLoader2, IconLock } from "@tabler/icons-react";
import { AuthShell, Alert, Field, PasswordField, SubmitButton, PasswordStrength, passwordChecks, isEmail } from "@/components/auth/AuthUI";

const safeReturnPath = (value) => {
  try {
    const path = decodeURIComponent(value || "");
    return path.startsWith("/") && !path.startsWith("//") ? path : "/account";
  } catch {
    return "/account";
  }
};

const needsVerification = (msg) => /verify|verification|not verified/i.test(msg || "");

/* ─── Sign in ───────────────────────────────────────────── */
function LoginForm({ redirect }) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Enter your email address";
    else if (!isEmail(email)) next.email = "That does not look like an email address";
    if (!password) next.password = "Enter your password";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      sessionStorage.setItem("justLoggedIn", "true");
      toast.success("Welcome back!");
      setTimeout(() => router.push(safeReturnPath(redirect)), 250);
    } catch (error) {
      setFormError(error?.message || "We could not sign you in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError && (
        <Alert
          type={needsVerification(formError) ? "warning" : "error"}
          action={
            needsVerification(formError) && (
              <Link href={`/verify-otp?email=${encodeURIComponent(email.trim())}`} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
                Enter your verification code <IconArrowRight size={14} />
              </Link>
            )
          }
        >
          {formError}
        </Alert>
      )}

      <Field
        label="Email"
        icon={IconMail}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        disabled={submitting}
        onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); setFormError(""); }}
        error={errors.email}
      />

      <PasswordField
        label="Password"
        icon={IconLock}
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        disabled={submitting}
        onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); setFormError(""); }}
        error={errors.password}
        labelRight={<Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ""}`} className="font-medium text-[#A8741F] hover:underline">Forgot password?</Link>}
      />

      <SubmitButton loading={submitting} loadingText="Signing in...">
        Sign in <IconArrowRight size={18} stroke={1.8} />
      </SubmitButton>
    </form>
  );
}

/* ─── Register ──────────────────────────────────────────── */
function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rules = {
    name: (v) => (v.trim().length < 3 ? "Enter your full name (at least 3 characters)" : ""),
    email: (v) => (!v.trim() ? "Enter your email address" : !isEmail(v) ? "That does not look like an email address" : ""),
    phone: (v) => (!isValidUsPhone(v) ? "Enter a valid US phone number, like (562) 524-3557" : ""),
    password: (v) => (v.length < 8 ? "Use at least 8 characters" : !(passwordChecks(v)[1].ok && passwordChecks(v)[2].ok) ? "Add upper and lower case letters and a number" : ""),
    confirmPassword: (v) => (!v ? "Confirm your password" : v !== form.password ? "The passwords do not match" : ""),
  };
  const errorOf = (name) => (touched[name] ? rules[name](form[name]) : "");

  const change = (e) => {
    const { name } = e.target;
    const value = name === "phone" ? formatUsPhone(e.target.value) : e.target.value;
    setForm((p) => ({ ...p, [name]: value }));
    setFormError("");
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    if (Object.keys(rules).some((k) => rules[k](form[k]))) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
      const payload = res?.data ?? res;
      if (payload?.debugOtp) toast.success(`Verification code: ${payload.debugOtp}`, { duration: 25000 });
      else if (payload?.emailSent !== false) toast.success("Account created. Check your email for the verification code.");
      else toast.warning("Account created, but the email could not be sent. Use Resend on the next page.");
      localStorage.setItem("registeredEmail", form.email.trim());
      setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim())}`), 500);
    } catch (error) {
      setFormError(error?.message || "We could not create your account. Please try again.");
      setSubmitting(false);
    }
  };

  const f = (name) => ({ name, value: form[name], onChange: change, onBlur: blur, error: errorOf(name), disabled: submitting });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert type="error">{formError}</Alert>}

      <Field label="Full name" icon={IconUser} autoComplete="name" placeholder="Jane Doe" {...f("name")} />
      <Field label="Email" icon={IconMail} type="email" autoComplete="email" placeholder="you@example.com" hint="We send your verification code here." {...f("email")} />
      <Field label="Phone" icon={IconPhone} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(562) 524-3557" maxLength={14} {...f("phone")} />
      <div>
        <PasswordField label="Password" icon={IconLock} autoComplete="new-password" placeholder="Create a password" {...f("password")} />
        <PasswordStrength password={form.password} />
      </div>
      <PasswordField label="Confirm password" icon={IconLock} autoComplete="new-password" placeholder="Repeat your password" {...f("confirmPassword")} />

      <SubmitButton loading={submitting} loadingText="Creating your account..." className="mt-2">
        Create account <IconArrowRight size={18} stroke={1.8} />
      </SubmitButton>

      <p className="text-center text-[12px] leading-relaxed text-[#6B7388]">
        By continuing you agree to our{" "}
        <Link href="/terms" className="font-medium text-[#12213F] underline underline-offset-2">Terms</Link> and{" "}
        <Link href="/privacy-policy" className="font-medium text-[#12213F] underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const tab = searchParams.get("tab") === "register" ? "register" : "login";
  const redirect = searchParams.get("redirect") || searchParams.get("returnUrl");

  useEffect(() => {
    if (isAuthenticated) router.push(safeReturnPath(redirect));
  }, [isAuthenticated, router, redirect]);

  const go = (next) => {
    const params = new URLSearchParams({ tab: next });
    if (redirect) params.set("redirect", redirect);
    router.push(`/auth?${params.toString()}`, { scroll: false });
  };

  const isLogin = tab === "login";

  return (
    <AuthShell
      eyebrow={isLogin ? "Welcome back" : "Join MWP"}
      title={isLogin ? "Sign in to your account" : "Create your account"}
      subtitle={isLogin ? "Track orders, reorder faster and manage your addresses." : "It takes a minute. We will email you a code to verify your address."}
      side={{
        headline: isLogin ? "Good to see you again." : "Your routine, in one place.",
        text: isLogin
          ? "Pick up where you left off: your orders, saved addresses and wishlist are waiting."
          : "Save your details, track your orders and check out faster, every time.",
      }}
      footer={
        isLogin ? (
          <>New to MWP? <button type="button" onClick={() => go("register")} className="font-semibold text-[#12213F] underline underline-offset-4 hover:text-[#B3001B]">Create an account</button></>
        ) : (
          <>Already have an account? <button type="button" onClick={() => go("login")} className="font-semibold text-[#12213F] underline underline-offset-4 hover:text-[#B3001B]">Sign in</button></>
        )
      }
    >
      {/* Tabs */}
      <div role="tablist" aria-label="Sign in or register" className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-[#F3EEDF] p-1">
        {[
          ["login", "Sign in"],
          ["register", "Register"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => go(key)}
            className={`h-11 rounded-xl text-[13px] font-semibold transition-all ${tab === key ? "bg-white text-[#12213F] shadow-sm" : "text-[#5A6275] hover:text-[#12213F]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLogin ? <LoginForm redirect={redirect} /> : <RegisterForm />}
    </AuthShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F2]">
          <IconLoader2 className="h-6 w-6 animate-spin text-[#12213F]" stroke={1.5} />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
