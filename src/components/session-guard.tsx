"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setUnauthorizedHandler } from "@/lib/api/browser";
import { createClient } from "@/lib/supabase/browser";

export function SessionGuard() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let redirecting = false;

    function toLogin() {
      if (redirecting) return;
      redirecting = true;
      const next = `${window.location.pathname}${window.location.search}`;
      router.replace(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
      router.refresh();
    }

    setUnauthorizedHandler(() => {
      if (redirecting) return;
      void supabase.auth.signOut({ scope: "local" }).finally(toLogin);
    });

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") toLogin();
    });

    return () => {
      setUnauthorizedHandler(null);
      data.subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
