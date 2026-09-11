"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconMail,
  IconKey,
  IconLoader2,
  IconArrowRight,
  IconArrowLeft,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyOtp, resendVerification } = useAuth();

  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => { setEmail(initialEmail); }, [initialEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Email is required");
    if (!/^\d{6}$/.test(otp)) return toast.error("Enter 6-digit OTP");

    setIsSubmitting(true);
    try {
      await verifyOtp(email, otp);
      toast.success("Verified! Logging you in...");
      setTimeout(() => router.push("/"), 500);
    } catch (err) {
      toast.error(err.message || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return toast.error("Enter your email to resend OTP");
    try {
      await resendVerification(email);
      toast.success("OTP sent to your email");
      setResendCooldown(30);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    const digit = value.replace(/[^\d]/g, "").slice(-1);
    const newOtp = otp.split("");
    newOtp[index] = digit;
    const joined = newOtp.join("");
    setOtp(joined);
    if (digit && index < 5) {
      const next = document.querySelector(`input[data-otp-index="${index + 1}"]`);
      if (next) next.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.querySelector(`input[data-otp-index="${index - 1}"]`);
      if (prev) prev.focus();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#0A0A0A]">
        <img src="/auth-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link href="/" className="inline-block">
            <span className="font-extrabold text-2xl text-white tracking-wider">MWP SUPPLEMENTS</span>
          </Link>
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-white/10 bg-white/5 backdrop-blur-sm">
              <IconKey className="h-3 w-3 text-red-500" stroke={1.5} />
              <span className="text-[9px] uppercase tracking-[0.3em] text-red-400 font-bold">Verification</span>
            </div>
            <h1 className="font-extrabold text-4xl xl:text-5xl text-white tracking-tight mb-6 leading-[1.1] uppercase">
              Confirm Your<br /><span className="text-red-500">Identity</span>
            </h1>
            <span className="block h-px w-16 bg-gradient-to-r from-red-500 to-transparent mb-6" />
            <p className="text-white/60 text-sm font-normal leading-relaxed max-w-sm">
              We&apos;ve sent a 6-digit verification code to your email address.
              Enter it below to authenticate your athlete account.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">&copy; {new Date().getFullYear()} MWP SUPPLEMENTS</p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-block">
              <span className="font-extrabold text-2xl text-gray-900 tracking-wider">MWP SUPPLEMENTS</span>
            </Link>
          </div>

          <Link href="/auth?tab=login" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-900 transition-colors mb-10">
            <IconArrowLeft className="h-3.5 w-3.5" stroke={1.5} /> Back to Sign In
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl text-gray-900 tracking-tight mb-1">Verify OTP</h2>
            <p className="text-[13px] text-gray-500 font-light">Enter the 6-digit code sent to your email</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Email</label>
              <div className="relative">
                <IconMail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-light placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-500"
                />
              </div>
            </div>

            {/* OTP Boxes */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">OTP Code</label>
              <div className="flex gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input
                    key={i}
                    data-otp-index={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-full h-14 text-center text-xl text-gray-900 bg-gray-50 border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all duration-500"
                  />
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 text-center font-light">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className={`font-medium transition-colors ${resendCooldown > 0 ? "text-gray-500/50 cursor-not-allowed" : "text-gray-900 hover:text-red-600"}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isSubmitting || otp.length < 6}
              className="w-full h-14 bg-red-600 text-white text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2.5 hover:bg-red-700 disabled:opacity-50 transition-all duration-500"
            >
              {isSubmitting ? <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.5} /> : <>Verify <IconArrowRight className="h-4 w-4" stroke={1.5} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-500 font-light mt-8">
            <Link href="/auth?tab=login" className="text-gray-900 font-medium hover:text-red-600 transition-colors">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <IconLoader2 className="h-6 w-6 animate-spin text-red-600" stroke={1.5} />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
