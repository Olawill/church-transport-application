// import { auth } from "@/auth";
// import { redirect } from "next/navigation";
import { Header } from "@/components/navigation/header";
import { LayoutBackground } from "./layout-background";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  // const session = await auth();

  // if (!session?.user) {
  //   redirect("/login");
  // }

  return (
    <div className="min-h-screen">
      {/* <Header key={`${session.user.id}-${session.user.role}`} /> */}
      <LayoutBackground>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </LayoutBackground>
    </div>
  );
};

export default MainLayout;
