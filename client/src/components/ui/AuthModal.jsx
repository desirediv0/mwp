"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  IconX,
} from "@tabler/icons-react";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeAuthModal} />

      <div className="relative w-full max-w-md bg-white border border-stone/20 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-stone hover:text-noir transition-colors z-20"
          aria-label="Close modal"
        >
          <IconX className="h-5 w-5" stroke={1.5} />
        </button>

        {/* Header Branding */}
        <div className="pt-8 pb-4 text-center px-6">
          <span className="font-extrabold text-xl text-noir tracking-wider block mb-1">
            MWP SUPPLEMENTS
          </span>
          <p className="text-[11px] text-stone uppercase tracking-[0.15em] font-medium">
            {activeTab === "login" ? "Welcome Back Athlete" : "Create Athlete Account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line px-6">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2.5 text-[11px] uppercase tracking-[0.15em] font-medium border-b-2 transition-all ${
              activeTab === "login"
                ? "border-gold text-noir font-semibold"
                : "border-transparent text-stone hover:text-noir"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2.5 text-[11px] uppercase tracking-[0.15em] font-medium border-b-2 transition-all ${
              activeTab === "register"
                ? "border-gold text-noir font-semibold"
                : "border-transparent text-stone hover:text-noir"
            }`}
          >
            Register
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6">
          {activeTab === "login" ? (
            <ModalLoginForm
              onSwitch={() => setActiveTab("register")}
              onSuccess={closeAuthModal}
              login={login}
            />
          ) : (
            <ModalRegisterForm
              onSwitch={() => setActiveTab("login")}
              onSuccess={closeAuthModal}
              register={register}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ModalLoginForm({ onSwitch, onSuccess, login }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      onSuccess();
    } catch (error) {
      const msg = error.message || "Login failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className={`p-3 border text-xs font-medium rounded animate-in fade-in duration-200 ${
          errorMsg.toLowerCase().includes("verify")
            ? "bg-amber-50 border-amber-300 text-amber-900"
            : "bg-neutral-50 border-neutral-200 text-neutral-700 flex items-center justify-between"
        }`}>
          <div>
            <p>{errorMsg}</p>
            {errorMsg.toLowerCase().includes("verify") && (
              <Link
                href={`/verify-otp?email=${encodeURIComponent(email)}`}
                onClick={onSuccess}
                className="inline-block mt-2 px-3 py-1.5 bg-noir text-ivory text-[10px] uppercase tracking-wider font-semibold hover:bg-gold transition-colors"
              >
                Enter OTP &amp; Verify Now &rarr;
              </Link>
            )}
          </div>
          {!errorMsg.toLowerCase().includes("verify") && (
            <button type="button" onClick={() => setErrorMsg("")} className="text-neutral-900 hover:text-neutral-800 text-sm font-bold ml-2">
              &times;
            </button>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-1.5">
          Email
        </label>
        <div className="relative">
          <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            required
            placeholder="you@example.com"
            className="w-full h-11 pl-10 pr-3 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            onClick={onSuccess}
            className="text-[10px] text-stone hover:text-gold transition-colors font-light"
          >
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMsg) setErrorMsg("");
            }}
            required
            placeholder="Enter password"
            className="w-full h-11 pl-10 pr-10 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-noir"
          >
            {showPassword ? <IconEyeOff className="h-4 w-4" stroke={1.5} /> : <IconEye className="h-4 w-4" stroke={1.5} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 mt-2 bg-noir text-ivory text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 hover:bg-gold disabled:opacity-50 transition-all"
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
      <p className="text-center text-[12px] text-stone font-light pt-2">
        Don&apos;t have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-noir font-medium hover:text-gold transition-colors">
          Create one
        </button>
      </p>
    </form>
  );
}

function ModalRegisterForm({ onSwitch, onSuccess, register }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (errorMsg) setErrorMsg("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (formData.name.trim().length < 3) {
      const msg = "Name should be at least 3 characters";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!formData.phone || formData.phone.length < 10) {
      const msg = "Please enter a valid phone number";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      const msg = "Please enter a valid email";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    if (formData.password.length < 8) {
      const msg = "Password should be at least 8 characters";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(formData);
      const payload = res?.data ?? res;
      const emailSent = payload?.emailSent !== false;

      if (emailSent) {
        toast.success("Account created! Check your email for verification OTP.");
      } else {
        toast.warning(res?.message || "Account created, but verification email could not be sent.");
      }

      localStorage.setItem("registeredEmail", formData.email);
      onSuccess();
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      const msg = error.message || "Registration failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errorMsg && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs font-medium rounded flex items-center justify-between animate-in fade-in duration-200">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")} className="text-neutral-900 hover:text-neutral-800 text-sm font-bold ml-2">
            &times;
          </button>
        </div>
      )}
      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-1">Name</label>
        <div className="relative">
          <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Full Name"
            className="w-full h-10 pl-10 pr-3 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-1">Email</label>
        <div className="relative">
          <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="you@example.com"
            className="w-full h-10 pl-10 pr-3 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-1">Phone</label>
        <div className="relative">
          <IconPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="10-digit Phone Number"
            className="w-full h-10 pl-10 pr-3 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-1">Password</label>
        <div className="relative">
          <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" stroke={1.5} />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="At least 8 characters"
            className="w-full h-10 pl-10 pr-10 bg-ivory border border-line text-noir text-[13px] font-light placeholder:text-stone/50 focus:outline-none focus:border-gold transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-noir"
          >
            {showPassword ? <IconEyeOff className="h-4 w-4" stroke={1.5} /> : <IconEye className="h-4 w-4" stroke={1.5} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 mt-2 bg-noir text-ivory text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 hover:bg-gold disabled:opacity-50 transition-all"
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

      <p className="text-center text-[12px] text-stone font-light pt-1">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-noir font-medium hover:text-gold transition-colors">
          Sign in
        </button>
      </p>
    </form>
  );
}
