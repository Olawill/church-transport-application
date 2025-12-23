import { Header } from "@/components/navigation/header";
import { NavAppSidebar } from "@/components/navigation/header-app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/session/server-session";
import { LayoutBackground } from "./layout-background";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await requireAuth();

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutBackground>
        <NavAppSidebar initialSession={session} />
        <SidebarInset className="flex flex-col min-h-screen">
          <Header initialSession={session} />
          {/* Fixed container that adapts to sidebar state */}
          <main className="flex-1 w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </LayoutBackground>
    </SidebarProvider>
  );
};

export default MainLayout;
