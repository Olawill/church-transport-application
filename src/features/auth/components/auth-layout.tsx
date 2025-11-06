import { ActsOnWheelsLogo } from "@/components/logo";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 rounded-lg">
      <div className="flex flex-col items-center gap-6">
        <ActsOnWheelsLogo />
        {children}
      </div>
    </div>
  );
};
