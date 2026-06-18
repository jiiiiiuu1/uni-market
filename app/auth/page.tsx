"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { ShoppingBag, AlertCircle } from "lucide-react";

export default function AuthPopupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const redirectToUrl = `${window.location.origin}/auth/callback`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectToUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err: any) {
      console.error("Google OAuth Error:", err);
      setError(
        err.message || "구글 로그인에 실패했습니다. Supabase 설정 및 리다이렉트 URI를 확인하세요."
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Google loading bar */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1.5 overflow-hidden bg-blue-100 z-50">
            <div className="h-full bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 animate-loading-bar" />
          </div>
        )}

        <div className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <ShoppingBag className="h-6 w-6 stroke-[2]" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              UNI MARKET 로그인
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              안전한 거래를 위해 인천대학교 이메일로 인증된 구글 계정으로 로그인해 주세요.
            </p>
          </div>

          {/* Google Sign In Button (SUPABASE ACTUAL OAUTH) */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm text-sm font-bold text-slate-750 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all cursor-pointer hover:shadow active:scale-[0.99]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.1.8-2.61 2.87v2.38h4.22c2.47-2.27 3.89-5.62 3.89-9.1z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-4.22-2.38c-1.12.75-2.55 1.2-3.71 1.2-2.85 0-5.27-1.92-6.13-4.51H1.45v2.48C3.43 21.6 7.42 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.87 15.4c-.22-.65-.35-1.35-.35-2.08s.13-1.43.35-2.08V6.76H1.45C.52 8.61 0 10.69 0 12.87s.52 4.26 1.45 6.11l4.42-2.48z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.42 0 3.43 2.4 1.45 6.76l4.42 3.65c.86-2.59 3.28-4.51 6.13-4.51z"
              />
            </svg>
            Google 계정으로 로그인 (OAuth)
          </button>

          {error && (
            <div className="text-[11px] text-red-650 dark:text-red-400 font-semibold bg-red-50/50 dark:bg-red-950/20 p-3.5 rounded-2xl border border-red-100 dark:border-red-950/40 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s infinite linear;
          width: 200%;
        }
      `}</style>
    </main>
  );
}
