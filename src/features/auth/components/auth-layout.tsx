import Image from "next/image";
import Link from "next/link";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 rounded-lg">
      <div className="flex flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-bold"
        >
          <Image
            src="/globe.svg"
            alt="ActsOnWheels"
            width={30}
            height={30}
            className="size-4.5"
          />
          ActsOnWheels
        </Link>
        {children}
      </div>
    </div>
  );
};
