import { Header } from "@/components/navigation/header";
import { requireAuth } from "@/lib/session/server-session";
import { LayoutBackground } from "./layout-background";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await requireAuth();

  return (
    <LayoutBackground>
      <div className="min-h-screen flex flex-col">
        <Header initialSession={session} />
        <main className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </LayoutBackground>
  );
};

export default MainLayout;
