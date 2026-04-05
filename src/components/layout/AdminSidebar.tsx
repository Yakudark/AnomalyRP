"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { supabaseBrowser as supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
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
      label: "Paramètres",
      icon: Settings,
      href: "/admin/settings",
      active: pathname === "/admin/settings",
    },
  ];

  return (
    <div className="flex flex-col h-full w-64 bg-[#0F1115] border-r border-white/5 shadow-2xl fixed left-0 top-0 z-40 hidden md:flex">
      {/* Header Admin */}
      <div className="p-6 border-b border-white/5">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldCheck className="text-red-500 w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">
            Anomaly<span className="text-red-500">Admin</span>
          </span>
        </Link>
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
