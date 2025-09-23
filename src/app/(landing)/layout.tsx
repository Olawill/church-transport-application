import { LandingFooter } from "@/components/navigation/landing/footer";
import { LandingHeader } from "@/components/navigation/landing/header";

const LandingLayout = async ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      {children}
      <LandingFooter />
    </div>
  );
};

export default LandingLayout;
