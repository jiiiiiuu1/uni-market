import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "💡 [Supabase Config] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Please add them to your .env.local file."
  );
}

// Initialize Supabase client if variables are present, otherwise use a safe Proxy fallback to prevent build/runtime crashes.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (new Proxy(
        {},
        {
          get(target, prop) {
            const warning = () => {
              console.warn(
                `⚠️ [Supabase Proxy] Supabase method "${String(
                  prop
                )}" was called, but Supabase is not configured yet. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.`
              );
            };

            // Return safe chainable mock methods for common Supabase queries
            if (prop === "auth") {
              return {
                getSession: async () => {
                  warning();
                  return { data: { session: null }, error: null };
                },
                signOut: async () => {
                  warning();
                  return { error: null };
                },
                signInWithOAuth: async () => {
                  warning();
                  return { error: null };
                },
                onAuthStateChange: () => {
                  warning();
                  return { data: { subscription: { unsubscribe: () => {} } } };
                },
              };
            }

            if (prop === "from") {
              return () => {
                warning();
                const chain = {
                  select: () => chain,
                  insert: () => Promise.resolve({ data: null, error: null }),
                  eq: () => chain,
                  single: async () => ({ data: null, error: null }),
                };
                return chain;
              };
            }

            // Return a safe function for any other call
            return () => {
              warning();
              return { data: null, error: null };
            };
          },
        }
      ) as any);
