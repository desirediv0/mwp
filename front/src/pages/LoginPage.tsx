"use client";

import type React from "react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { loginbg } from "@/assets";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!password) {
      setFormError("Password is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
    } catch (error: any) {
      console.error("Login error:", error);
      setFormError(error.message || "Failed to login. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#111111]">
      {/* Left Side - Background Image */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={loginbg}
            alt="MWP SUPPLEMENTS Admin"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/90 via-[#09090b]/50 to-transparent" />
        </div>
        <div className="absolute inset-0 flex items-end p-12 xl:p-16">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="block h-px w-8 bg-red-500" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-red-400 font-semibold">
                MEN &bull; WOMEN &bull; POWER
              </span>
            </div>
            <h2 className="font-extrabold text-3xl xl:text-4xl text-white tracking-tight leading-tight uppercase">
              MWP <span className="text-red-500">ADMIN PORTAL</span>
            </h2>
            <p className="text-[13px] text-white/60 font-normal leading-relaxed max-w-sm">
              Manage product formulations, batch inventories, order shipments, and partner commissions.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-4 md:inset-6 border border-white/5 pointer-events-none hidden lg:block" aria-hidden="true" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Brand Mark */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="block h-px w-6 bg-red-500" />
              <span className="text-[9px] uppercase tracking-[0.4em] text-red-400 font-bold">
                Master Control
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight uppercase">
              MWP SUPPLEMENTS
            </h1>
            <p className="text-[13px] text-white/50 font-normal leading-relaxed">
              Enter your credentials to access the central management console.
            </p>
          </div>

          {/* Error Display */}
          {(error || formError) && (
            <div className="rounded bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-[13px] text-red-400 font-light text-center">
                {formError || error}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] uppercase tracking-[0.15em] text-white/50 font-light"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="admin@mwpsupplements.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                  required
                  className={`w-full h-12 px-4 bg-white/[0.03] border text-white placeholder-white/20 text-[14px] font-light
                    transition-all duration-300 rounded-[3px]
                    ${focusedField === "email"
                      ? "border-red-500/60 shadow-[0_0_0_3px_rgba(220,38,38,0.08)]"
                      : "border-white/10 hover:border-white/20"
                    }
                    focus:outline-none
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[11px] uppercase tracking-[0.15em] text-white/50 font-light"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  disabled={isSubmitting}
                  required
                  className={`w-full h-12 px-4 pr-20 bg-white/[0.03] border text-white placeholder-white/20 text-[14px] font-light
                    transition-all duration-300 rounded-[3px]
                    ${focusedField === "password"
                      ? "border-red-500/60 shadow-[0_0_0_3px_rgba(220,38,38,0.08)]"
                      : "border-white/10 hover:border-white/20"
                    }
                    focus:outline-none
                    disabled:opacity-40 disabled:cursor-not-allowed`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/30 hover:text-white/60 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 text-[12px] tracking-[0.15em]
                bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600
                text-white rounded-xl font-bold uppercase
                transition-all duration-300
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                mt-6"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 text-center font-medium">
              MWP SUPPLEMENTS &bull; MEN | WOMEN | POWER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
