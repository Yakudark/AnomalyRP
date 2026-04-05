import Image from "next/image";
import Link from "next/link";
import { AppSidebar } from "@/components/layout/AppSidebar";
import headerImage from "@/lib/asset/anomalyRP.png";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[380px] bg-[linear-gradient(180deg,#050705_0%,#071107_34%,#0b1908_76%,#171313_76%,#171313_100%)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(8,28,8,0.88)_18%,rgba(18,64,18,0.72)_50%,rgba(8,28,8,0.88)_82%,rgba(0,0,0,0.94)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/8" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-6 md:px-10">
        <div className="flex justify-end pb-3">
          <Link
            href="/admin/login"
            className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:text-primary md:text-xs"
          >
            Login
          </Link>
        </div>

        <section className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden md:max-w-[260px]">
          <div className="absolute inset-0">
            <Image
              src={headerImage}
              alt="Header Astral"
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="relative flex h-full flex-col px-4 pb-4 pt-4">
            <div className="flex flex-1 items-center justify-center">
              <div className="h-16 w-16 md:h-20 md:w-20" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-6 py-8 md:px-10">
        <AppSidebar />
        <main className="min-w-0 flex-1">
          <div className="fade-in-section">{children}</div>
        </main>
      </div>
    </div>
  );
}
