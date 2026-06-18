"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@myskillora/types";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearUser } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    setLoading(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, role, full_name, avatar_url, onboarding_complete")
          .eq("id", session.user.id)
          .single();

        if (userData) {
          setUser(userData as AuthUser);
        }
      } else {
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearUser();
  };

  return { user, isLoading, signOut };
}
