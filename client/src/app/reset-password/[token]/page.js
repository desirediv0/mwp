"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconArrowRight,
  IconCheck,
  IconKey,
} from "@tabler/icons-react";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token;

  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to reset password. Link may be expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-[#0A0A0A]">
        <img
          src="/auth-hero.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <Link href="/" className="inline-block">
            <span className="text-2xl text-white tracking-tight">
              MWP SUPPLEMENTS
            </span>
          </Link>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 border border-white/10 bg-white/5 backdrop-blur-sm">
              <IconKey className="h-3 w-3 text-red-600" stroke={1.5} />
              <span className="text-[9px] uppercase tracking-[0.3em] text-red-600 font-medium">
                New Password
              </span>
            </div>
            <h1 className="text-4xl xl:text-5xl text-white tracking-tight mb-6 leading-[1.1]">
              Set New <br />
              <em className="luxe-italic text-red-600">Password</em>
            </h1>
            <p className="text-white/40 text-sm font-light leading-relaxed max-w-sm">
              Create a strong password to protect your account.
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
            &copy; {new Date().getFullYear()} MWP SUPPLEMENTS
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-12 lg:py-0">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-block">
              <span className="text-2xl text-gray-900 tracking-tight">
                MWP SUPPLEMENTS
              </span>
            </Link>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconCheck className="h-7 w-7 text-green-600" stroke={1.5} />
              </div>
              <h2 className="text-2xl text-gray-900 tracking-tight mb-2">
                Password Reset Complete
              </h2>
              <p className="text-sm text-gray-500 font-light mb-8">
                Your password has been reset successfully. You can now sign in with your new credentials.
              </p>
              <Link
                href="/auth?tab=login"
                className="w-full h-14 bg-red-600 text-white text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-all"
              >
                Sign In
                <IconArrowRight className="h-4 w-4" stroke={1.5} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl text-gray-900 tracking-tight mb-1">
                  Create new password
                </h2>
                <p className="text-[13px] text-gray-500 font-light">
                  Your new password must be at least 8 characters long.
                </p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters"
                    className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-light placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                  >
                    {showPassword ? <IconEyeOff className="h-4 w-4" stroke={1.5} /> : <IconEye className="h-4 w-4" stroke={1.5} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <IconLock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" stroke={1.5} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className="w-full h-14 pl-12 pr-12 bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-light placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-600/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-14 bg-red-600 text-white text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2.5 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <IconLoader2 className="h-4 w-4 animate-spin" stroke={1.5} />
                ) : (
                  <>
                    Reset Password
                    <IconArrowRight className="h-4 w-4" stroke={1.5} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
