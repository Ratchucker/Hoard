import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";
import { AuthGate } from "@/components/layout/auth-gate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-full">
        <Sidebar />
        <div className="md:pl-64 flex flex-col min-h-full">
          <Topbar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </AuthGate>
  );
}
