"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Home,
  KeyRound,
  Link as LinkIcon,
  Images,
  ScrollText,
  LockKeyhole,
} from "lucide-react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type PasswordChangedEvent = CustomEvent<{ passwordChangedAt?: string }>;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);
  const [passwordNotificationOpen, setPasswordNotificationOpen] = useState(false);
  const [passwordNotificationReadAt, setPasswordNotificationReadAt] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  useEffect(() => {
    let mounted = true;

    async function loadPasswordNotification() {
      const storedChangedAt = window.localStorage.getItem("admin:lastPasswordChangedAt");
      const storedReadAt = window.localStorage.getItem("admin:lastPasswordNotificationReadAt");

      if (mounted) {
        setPasswordChangedAt(storedChangedAt);
        setPasswordNotificationReadAt(storedReadAt);
      }

      const { data } = await supabase.auth.getUser();
      const metadataChangedAt = data.user?.user_metadata?.password_changed_at;

      if (mounted && typeof metadataChangedAt === "string") {
        setPasswordChangedAt(metadataChangedAt);
        window.localStorage.setItem("admin:lastPasswordChangedAt", metadataChangedAt);
      }
    }

    const handlePasswordChanged = (event: Event) => {
      const changedAt = (event as PasswordChangedEvent).detail?.passwordChangedAt;

      if (!changedAt) return;

      setPasswordChangedAt(changedAt);
      setPasswordNotificationReadAt(null);
      setPasswordNotificationOpen(true);
      window.localStorage.removeItem("admin:lastPasswordNotificationReadAt");
    };

    loadPasswordNotification();
    window.addEventListener("admin-password-changed", handlePasswordChanged);

    return () => {
      mounted = false;
      window.removeEventListener("admin-password-changed", handlePasswordChanged);
    };
  }, []);

  const passwordNotificationUnread = useMemo(() => {
    if (!passwordChangedAt) return false;
    if (!passwordNotificationReadAt) return true;

    return new Date(passwordChangedAt).getTime() > new Date(passwordNotificationReadAt).getTime();
  }, [passwordChangedAt, passwordNotificationReadAt]);

  const formattedPasswordChangedAt = useMemo(() => {
    if (!passwordChangedAt) return null;

    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(passwordChangedAt));
  }, [passwordChangedAt]);

  const togglePasswordNotification = () => {
    const nextOpen = !passwordNotificationOpen;

    setPasswordNotificationOpen(nextOpen);

    if (nextOpen && passwordChangedAt) {
      const readAt = new Date().toISOString();
      setPasswordNotificationReadAt(readAt);
      window.localStorage.setItem("admin:lastPasswordNotificationReadAt", readAt);
    }
  };

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
    },
    {
      label: "Articles & Sections",
      icon: FileText,
      href: "/admin/content",
      active: pathname?.startsWith("/admin/content"),
    },
    {
      label: "Accueil",
      icon: Home,
      href: "/admin/home",
      active: pathname === "/admin/home",
    },
    {
      label: "Liens publics",
      icon: LinkIcon,
      href: "/admin/links",
      active: pathname === "/admin/links",
    },
    {
      label: "Mentions legales",
      icon: ScrollText,
      href: "/admin/legal",
      active: pathname === "/admin/legal",
    },
    {
      label: "Galerie",
      icon: Images,
      href: "/admin/gallery",
      active: pathname === "/admin/gallery",
    },
    {
      label: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings",
    },
    {
      label: "Compte admin",
      icon: KeyRound,
      href: "/admin/account",
      active: pathname === "/admin/account",
    },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-[#0F1115] border-r border-white/5 shadow-2xl fixed left-0 top-0 z-40 hidden md:flex">
      {/* Header Admin */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2">
            <div className="size-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <ShieldCheck className="text-red-500 w-5 h-5" />
            </div>
            <span className="truncate font-bold text-xl tracking-tight text-white">
              Anomaly<span className="text-red-500">Admin</span>
            </span>
          </Link>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-muted-foreground hover:bg-white/5 hover:text-white"
              onClick={togglePasswordNotification}
              aria-label="Notification de changement de mot de passe"
              aria-expanded={passwordNotificationOpen}
            >
              <LockKeyhole className="h-4 w-4" />
              {passwordNotificationUnread && (
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0F1115]" />
              )}
            </Button>

            {passwordNotificationOpen && (
              <div className="absolute left-full top-0 z-50 ml-3 w-72 rounded-md border border-white/10 bg-[#151820] p-3 text-sm shadow-2xl">
                <p className="font-medium text-white">Mot de passe modifie</p>
                <p className="mt-1 text-muted-foreground">
                  {formattedPasswordChangedAt
                    ? `Dernier changement : ${formattedPasswordChangedAt}`
                    : "Aucun changement enregistre."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group font-medium text-sm",
              route.active
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-muted-foreground hover:text-white hover:bg-white/5",
            )}
          >
            <route.icon
              className={cn(
                "h-4 w-4 transition-colors",
                route.active
                  ? "text-red-400"
                  : "text-muted-foreground group-hover:text-red-400",
              )}
            />
            {route.label}
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02]">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
