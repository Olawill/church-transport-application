import { cn } from "@/lib/utils";
import { FieldError } from "react-hook-form";
import PhoneInput, { isSupportedCountry } from "react-phone-number-input";

import "react-phone-number-input/style.css";

interface CustomPhoneInputProps {
  placeholder?: string;
  defaultCountry?: string;
  value: string;
  onChange: () => void;
  onBlur: () => void;
  className?: string;
  disabled?: boolean;
  error?: FieldError;
}

const CustomPhoneInput = ({
  placeholder,
  defaultCountry,
  value,
  onChange,
  onBlur,
  className,
  disabled,
  error,
}: CustomPhoneInputProps) => {
  const customCountry =
    defaultCountry && isSupportedCountry(defaultCountry)
      ? defaultCountry
      : "CA";
  return (
    <PhoneInput
      placeholder={placeholder}
      defaultCountry={customCountry}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        error && "ring-destructive border-destructive",
        className
      )}
      disabled={disabled}
    />
  );
};

export default CustomPhoneInput;
