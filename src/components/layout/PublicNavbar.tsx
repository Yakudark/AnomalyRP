"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/shared/CommandMenu";

export function PublicNavbar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="mb-6 border border-primary/15 bg-[#081108]/80 px-4 py-3 shadow-[0_0_0_1px_rgba(66,233,62,0.08),0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-primary/30 bg-black/25 text-sm font-black text-primary">
            A
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold uppercase tracking-[0.2em] text-white">
              Anomaly RP
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Reglement, guides et infos serveur
            </span>
          </span>
        </Link>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full justify-start gap-3 rounded-sm border-primary/25 bg-black/20 px-3 text-left text-muted-foreground hover:border-primary/70 hover:bg-primary/10 hover:text-white md:w-[360px]"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate">Rechercher sur le site</span>
          <span className="hidden shrink-0 rounded-sm border border-white/10 bg-black/25 px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">
            Ctrl K
          </span>
        </Button>
      </div>

      <CommandMenu open={searchOpen} setOpen={setSearchOpen} />
    </header>
  );
}
