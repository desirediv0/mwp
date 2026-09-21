"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  IconMail,
  IconLock,
  IconUser,
  IconPhone,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconX,
  IconSparkles,
} from "@tabler/icons-react";

/* ─── Password Strength ─────────────────────────────────── */
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
};

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = ["", "text-neutral-600", "text-orange-500", "text-neutral-800", "text-green-600"];

/* ─── Auth Form ─────────────────────────────────────────── */
function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const tabFromUrl = searchParams.get("tab") || "login";
  const redirect = searchParams.get("redirect");
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => { setActiveTab(tabFromUrl); }, [tabFromUrl]);
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirect ? decodeURIComponent(redirect) : "/");
    }
  }, [isAuthenticated, router, redirect]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams({ tab });
    if (redirect) params.set("redirect", redirect);
    router.push(`/auth?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left Panel — Branding (Desktop) ──────────────── */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-[#0A0A0A]">
        {/* Background image */}
        <img
          src="/auth-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="MWP SUPPLEMENTS" className="h-11 w-auto object-contain" />
          </Link>

          {/* Center text */}
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/70 font-bold">
                Men &bull; Women &bull; Power
              </span>
            </div>
            <h1 className="font-extrabold text-4xl xl:text-[3.25rem] text-white tracking-tight mb-5 leading-[1.05] uppercase">
              Fuel Your
              <br />
              <span className="text-white/70">Next Personal Best</span>
            </h1>
            <span className="block h-1 w-16 rounded-full bg-gradient-to-r from-white/50 to-transparent mb-6" />
            <p className="text-white/70 text-[15px] font-normal leading-relaxed max-w-sm">
              Create your MWP account for faster checkout, order tracking, exclusive
              stack discounts, and evidence-based training protocols.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5 text-[12px] font-semibold text-white/60">
              <span className="inline-flex items-center gap-1.5"><IconCheck className="h-4 w-4 text-white/70" /> 3rd-party lab tested</span>
              <span className="inline-flex items-center gap-1.5"><IconCheck className="h-4 w-4 text-white/70" /> GMP &amp; FSSAI certified</span>
              <span className="inline-flex items-center gap-1.5"><IconCheck className="h-4 w-4 text-white/70" /> Free shipping ₹999+</span>
            </div>
          </div>

          {/* Bottom */}
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            &copy; {new Date().getFullYear()} MWP SUPPLEMENTS &bull; All Rights Reserved
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl text-gray-900 tracking-wider">
                MWP SUPPLEMENTS
              </span>
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1.5 bg-gray-100 rounded-2xl mb-10">
            {[
              { key: "login", label: "Sign In" },
              { key: "register", label: "Register" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`flex-1 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-bold transition-all duration-300 ${
                  activeTab === key
                    ? "bg-white text-gray-900 shadow-sm rounded-xl"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white">
            {activeTab === "login" && (
              <LoginForm
                onSwitch={() => handleTabChange("register")}
                redirect={redirect}
              />
            )}
            {activeTab === "register" && (
              <RegisterForm
                onSwitch={() => handleTabChange("login")}
                redirect={redirect}
              />
            )}
          </div>

          {/* Terms */}
          <p className="text-center text-[11px] text-gray-500 mt-8 font-light">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-gray-900 hover:text-neutral-800 transition-colors underline underline-offset-2">Terms</Link>
            {" "}&{" "}
            <Link href="/privacy-policy" className="text-gray-900 hover:text-neutral-800 transition-colors underline underline-offset-2">Privacy Policy</Link>
          </p>
        </div>
      </div>

    </div>
  );
}

/* ─── Login Form ────────────────────────────────────────── */
function LoginForm({ onSwitch, redirect }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      const msg = "Email and password are required";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
      sessionStorage.setItem("justLoggedIn", "true");
      toast.success("Welcome back!");
      const returnUrl = searchParams.get("returnUrl") || searchParams.get("redirect");
      setTimeout(() => router.push(returnUrl ? decodeURIComponent(returnUrl) : "/"), 300);
    } catch (error) {
      const msg = error.message || "Login failed.";
      setErrorMsg(msg);
      if (msg.toLowerCase().includes("verify")) {
        toast.error(
          <div>
            {msg}{" "}
            <Link href={`/verify-otp?email=${encodeURIComponent(email)}`} className="font-medium underline text-white ml-1">
              Verify OTP
            </Link>
          </div>
        );
      } else { toast.error(msg); }
    } finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl text-gray-900 tracking-tight mb-1">Welcome back</h2>
        <p className="text-[13px] text-gray-500 font-light">Sign in to access your account</p>
      </div>

      {errorMsg && (
        <div className={`p-3.5 border text-xs font-medium rounded animate-in fade-in duration-200 ${
          errorMsg.toLowerCase().includes("verify")
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-neutral-100 border-neutral-200 text-neutral-900 flex items-center justify-between"
        }`}>
          <div>
            <p>{errorMsg}</p>
            {errorMsg.toLowerCase().includes("verify") && (
              <Link
                href={`/verify-otp?email=${encodeURIComponent(email)}`}
                className="inline-block mt-2.5 px-4 py-2 bg-neutral-900 text-white text-[10px] uppercase tracking-wider font-semibold hover:bg-neutral-900 transition-colors shadow-sm"
              >
                Enter OTP to Verify Account &rarr;
              </Link>
            )}
          </div>
          {!errorMsg.toLowerCase().includes("verify") && (
            <button type="button" onClick={() => setErrorMsg("")} className="text-neutral-600 hover:text-neutral-900 text-sm font-bold ml-2">
              &times;
            </button>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Email</label>
        <div className="relative">
          <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[13.5px] placeholder:text-gray-400 focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Password</label>
          <Link href="/forgot-password" className="text-[11px] text-gray-500 hover:text-neutral-800 transition-colors font-light">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[13.5px] placeholder:text-gray-400 focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            {showPassword ? <IconEyeOff className="h-4 w-4" stroke={1.5} /> : <IconEye className="h-4 w-4" stroke={1.5} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 rounded-xl bg-neutral-900 text-white text-[12px] uppercase tracking-[0.15em] font-bold shadow-lg shadow-neutral-900/20 flex items-center justify-center gap-2.5 hover:bg-neutral-900 disabled:opacity-50 transition-all duration-500"
      >
        {isSubmitting ? (
          <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.5} />
        ) : (
          <>
            Sign In
            <IconArrowRight className="h-4 w-4" stroke={1.5} />
          </>
        )}
      </button>

      {/* Switch */}
      <p className="text-center text-[13px] text-gray-500 font-light pt-2">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-gray-900 font-medium hover:text-neutral-800 transition-colors">
          Create one
        </button>
      </p>
    </form>
  );
}

/* ─── Register Form ─────────────────────────────────────── */
function RegisterForm({ onSwitch, redirect }) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errorMsg) setErrorMsg("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.name.trim().length < 3) {
      const msg = "Name should be at least 3 characters";
      setErrorMsg(msg);
      toast.error(msg);
      return false;
    }
    if (!formData.phone || formData.phone.length < 10) {
      const msg = "Please enter a valid phone number";
      setErrorMsg(msg);
      toast.error(msg);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      const msg = "Please enter a valid email";
      setErrorMsg(msg);
      toast.error(msg);
      return false;
    }
    if (formData.password.length < 8) {
      const msg = "Password should be at least 8 characters";
      setErrorMsg(msg);
      toast.error(msg);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      const msg = "Passwords do not match";
      setErrorMsg(msg);
      toast.error(msg);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const res = await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
      const payload = res?.data ?? res;
      const emailSent = payload?.emailSent !== false;
      if (payload?.debugOtp) {
        toast.success(`Verification code: ${payload.debugOtp}`, { duration: 25000 });
      } else if (emailSent) {
        toast.success("Account created! Check your email for OTP.", { duration: 4000 });
      } else {
        toast.warning(res?.message || "Account created but email could not be sent.");
      }
      localStorage.setItem("registeredEmail", formData.email);
      setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`), 600);
    } catch (error) {
      const msg = error.message || "Registration failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally { setIsSubmitting(false); }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const fields = [
    { label: "Full Name", name: "name", type: "text", icon: IconUser, placeholder: "John Doe" },
    { label: "Email", name: "email", type: "email", icon: IconMail, placeholder: "you@example.com" },
    { label: "Phone", name: "phone", type: "tel", icon: IconPhone, placeholder: "+91 9876543210" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl text-gray-900 tracking-tight mb-1">Create account</h2>
        <p className="text-[13px] text-gray-500 font-light">Join the MWP SUPPLEMENTS family</p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs font-medium rounded flex items-center justify-between animate-in fade-in duration-200">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")} className="text-neutral-600 hover:text-neutral-900 text-sm font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {fields.map(({ label, name, type, icon: Icon, placeholder }) => (
        <div key={name}>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">{label}</label>
          <div className="relative">
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
            <input
              type={type}
              name={name}
              value={formData[name]}
              onChange={handleChange}
              required
              placeholder={placeholder}
              className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[13.5px] placeholder:text-gray-400 focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
            />
          </div>
        </div>
      ))}

      {/* Password */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Password</label>
        <div className="relative">
          <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Min 8 characters"
            className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[13.5px] placeholder:text-gray-400 focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            {showPassword ? <IconEyeOff className="h-4 w-4" stroke={1.5} /> : <IconEye className="h-4 w-4" stroke={1.5} />}
          </button>
        </div>
        {/* Strength indicator */}
        {formData.password && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 transition-all duration-500 ${
                    i <= passwordStrength
                      ? passwordStrength <= 1 ? "bg-neutral-800"
                        : passwordStrength === 2 ? "bg-orange-500"
                        : passwordStrength === 3 ? "bg-neutral-900"
                        : "bg-green-600"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${strengthColors[passwordStrength]}`}>
              {strengthLabels[passwordStrength]}
            </span>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Confirm Password</label>
        <div className="relative">
          <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
            className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-[13.5px] placeholder:text-gray-400 focus:outline-none focus:border-neutral-800 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
          />
          {formData.confirmPassword && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {formData.password === formData.confirmPassword ? (
                <IconCheck className="h-4 w-4 text-green-600" stroke={2} />
              ) : (
                <IconX className="h-4 w-4 text-neutral-600" stroke={2} />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-14 rounded-xl bg-neutral-900 text-white text-[12px] uppercase tracking-[0.15em] font-bold shadow-lg shadow-neutral-900/20 flex items-center justify-center gap-2.5 hover:bg-neutral-900 disabled:opacity-50 transition-all duration-500"
      >
        {isSubmitting ? (
          <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.5} />
        ) : (
          <>
            Create Account
            <IconArrowRight className="h-4 w-4" stroke={1.5} />
          </>
        )}
      </button>

      {/* Switch */}
      <p className="text-center text-[13px] text-gray-500 font-light pt-2">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-gray-900 font-medium hover:text-neutral-800 transition-colors">
          Sign In
        </button>
      </p>
    </form>
  );
}

/* ─── Page Export ───────────────────────────────────────── */
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <IconLoader2 className="h-6 w-6 animate-spin text-neutral-800" stroke={1.5} />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
