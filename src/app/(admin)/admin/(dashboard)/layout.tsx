import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminAuthGuard } from "@/components/layout/AdminAuthGuard";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen bg-[#0a0a0f]"> {/* Fond un peu plus sombre pour l'admin */}
        <AdminSidebar />
        <main className="flex-1 md:pl-64 transition-all duration-300 ease-in-out">
           <div className="p-6 md:p-10 fade-in-section">
              {children}
           </div>
        </main>
      </div>
    </AdminAuthGuard>
  );
}
