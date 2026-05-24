"use client";

import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AdminAuthGuardProps = {
  children: ReactNode;
};

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const { data } = await supabaseBrowser.auth.getSession();

      if (!mounted) return;

      if (!data.session) {
        router.replace("/admin/login");
        return;
      }

      setAuthorized(true);
    }

    verifySession();

    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthorized(false);
        router.replace("/admin/login");
        return;
      }

      setAuthorized(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0a0a0f] text-muted-foreground">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verification de la session admin...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
