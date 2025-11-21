import { LandingFooter } from "@/components/navigation/landing/footer";
import { LandingHeader } from "@/components/navigation/landing/header";

const LandingLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</main>
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;
