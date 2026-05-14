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

      <div className="relative mx-auto w-full max-w-7xl px-6 py-8 md:px-10">
        <main className="min-w-0">
          <div className="fade-in-section">{children}</div>
        </main>
      </div>
    </div>
  );
}
