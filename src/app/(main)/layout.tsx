import { Header } from "@/components/navigation/header";
import { LayoutBackground } from "./layout-background";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <LayoutBackground>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </LayoutBackground>
  );
};

export default MainLayout;
