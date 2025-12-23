import { CarIcon } from "lucide-react";
import { CustomLink as Link } from "./custom-link";

export const ActsOnWheelsLogo = () => {
  return (
    <div className="flex items-center">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="size-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all duration-200">
          <CarIcon className="size-5 text-white" />
        </div>
        <div className="block">
          <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap">
            Acts
            <span className="text-blue-600">On</span>
            Wheels
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-100 font-medium tracking-widest uppercase -mt-0.5 whitespace-nowrap">
            Church Transportation
          </div>
        </div>
      </Link>
    </div>
  );
};
