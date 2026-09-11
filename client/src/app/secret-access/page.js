"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function SecretAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [status, setStatus] = useState("loading");
  const [tokenData, setTokenData] = useState(null);
  const [activating, setActivating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStatus("no_token");
      return;
    }
    try {
      const res = await fetchApi(`/secret-access/verify-token?token=${token}`);
      if (res.success && res.data.valid) {
        setTokenData(res.data);
        setStatus("valid");
      } else {
        setErrorMsg(
          res.data.reason === "expired" ? "This invitation has expired."
          : res.data.reason === "revoked" ? "This invitation has been revoked."
          : res.data.reason === "already_used" ? "This invitation has already been used."
          : "Invalid invitation link."
        );
        setStatus("invalid");
      }
    } catch (err) {
      setErrorMsg("Failed to verify invitation.");
      setStatus("invalid");
    }
  }, [token]);

  useEffect(() => {
    if (!authLoading) {
      verifyToken();
    }
  }, [authLoading, verifyToken]);

  const handleActivate = async () => {
    if (!isAuthenticated || !user) {
      router.push(`/auth?redirect=/secret-access?token=${token}`);
      return;
    }
    setActivating(true);
    try {
      const res = await fetchApi("/secret-access/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.success) {
        setStatus("activated");
        setTimeout(() => router.push("/secret-collection"), 3000);
      } else {
        setErrorMsg(res.message || "Activation failed.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg(err.message || "Activation failed.");
      setStatus("error");
    } finally {
      setActivating(false);
    }
  };

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (status === "no_token") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Secret <span className="text-[#D4AF37]">Collection</span>
          </h1>
          <p className="text-gray-400 mb-8">No invitation token provided. Please use the link from your email.</p>
          <Link href="/secret-collection" className="inline-block px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#B8860B] transition-colors">
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  if (status === "invalid" || status === "error") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Invitation Invalid</h1>
          <p className="text-gray-400 mb-8">{errorMsg}</p>
          <Link href="/secret-collection" className="inline-block px-8 py-3 bg-[#D4AF37] text-black font-bold rounded-lg hover:bg-[#B8860B] transition-colors">
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  if (status === "activated") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to the <span className="text-[#D4AF37]">Secret Collection</span>
          </h1>
          <p className="text-gray-400 mb-8">Your access has been activated. Redirecting you now...</p>
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/30">
            <svg className="w-10 h-10 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Secret <span className="text-[#D4AF37]">Collection</span>
          </h1>
          <p className="text-gray-400">Exclusive access invitation</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          {tokenData && (
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Access Code</span>
                <span className="text-[#D4AF37] font-mono font-bold">{tokenData.displayCode}</span>
              </div>
              {tokenData.orderNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order</span>
                  <span className="text-white font-mono">#{tokenData.orderNumber}</span>
                </div>
              )}
              {tokenData.expiresAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valid Until</span>
                  <span className="text-white">{new Date(tokenData.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {!isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm text-center mb-4">You need to sign in to activate this invitation.</p>
              <Link
                href={`/auth?redirect=/secret-access?token=${token}`}
                className="block w-full py-3 bg-[#D4AF37] text-black font-bold rounded-lg text-center hover:bg-[#B8860B] transition-colors"
              >
                Sign In to Activate
              </Link>
              <Link
                href={`/auth?tab=register&redirect=/secret-access?token=${token}`}
                className="block w-full py-3 border border-zinc-700 text-white font-bold rounded-lg text-center hover:bg-zinc-800 transition-colors"
              >
                Create Account
              </Link>
            </div>
          ) : (
            <button
              onClick={handleActivate}
              disabled={activating}
              className="w-full py-4 bg-[#D4AF37] text-black font-bold rounded-lg text-center hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Activating...
                </span>
              ) : (
                "Activate Secret Collection"
              )}
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/secret-collection" className="text-gray-500 hover:text-[#D4AF37] text-sm transition-colors">
            Browse Public Collection
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SecretAccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SecretAccessContent />
    </Suspense>
  );
}
