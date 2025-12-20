import { Header } from "@/components/navigation/header";
import { NavAppSidebar } from "@/components/navigation/header-app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAuth } from "@/lib/session/server-session";
import { LayoutBackground } from "./layout-background";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await requireAuth();

  return (
    <LayoutBackground>
      <SidebarProvider defaultOpen={false}>
        <div className="flex flex-col w-full">
          <Header initialSession={session} />
          <div className="flex flex-1">
            <NavAppSidebar initialSession={session} />
            <SidebarInset className="flex-1">
              <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </LayoutBackground>
  );
};

export default MainLayout;
