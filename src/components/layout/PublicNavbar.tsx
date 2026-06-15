import Link from "next/link";

export function PublicNavbar() {
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
      </div>
    </header>
  );
}
