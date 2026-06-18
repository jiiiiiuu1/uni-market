"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/AppContext";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { currentUser, isInitialized } = useApp();

  useEffect(() => {
    if (isInitialized && currentUser) {
      router.push("/");
    }
  }, [isInitialized, currentUser, router]);

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
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              인천대 학우님, 반갑습니다!
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              UNI MARKET은 인천대 구성원만 거래 가능한 안전 지대입니다.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm text-sm font-bold text-slate-750 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-850 dark:hover:bg-slate-800 transition-all cursor-pointer hover:shadow active:scale-[0.99]"
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
              <div className="text-xs text-red-650 dark:text-red-400 font-semibold bg-red-50/50 dark:bg-red-950/20 p-3.5 rounded-xl border border-red-100 dark:border-red-950/40">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
