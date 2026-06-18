"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldCheck } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase JS client automatically handles hash/code parameters on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Logged in successfully
        if (window.opener) {
          // Send message to parent window to sync states
          window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
          // Close popup window
          window.close();
        } else {
          // Direct navigation fallback
          router.push("/");
        }
      } else {
        // Listen to state change if session is being established
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: any, session: any) => {
            if (session) {
              if (window.opener) {
                window.opener.postMessage({ type: "AUTH_SUCCESS" }, window.location.origin);
                window.close();
              } else {
                router.push("/");
              }
              subscription.unsubscribe();
            }
          }
        );

        // Fail-safe timeout (redirect home if nothing happens after 5s)
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          router.push("/");
        }, 5000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timeout);
        };
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">인천대 학우님 인증 중...</h2>
          <p className="text-xs text-slate-500">잠시만 기다려 주세요. 로그인 정보를 연동하고 있습니다.</p>
        </div>
      </div>
    </main>
  );
}
