import { cn } from "@/lib/utils";

import { FormLabel } from "@/components/ui/form";

interface Props {
  title: string;
  className?: string;
}

export const CustomFormLabel = ({ title, className }: Props) => {
  return (
    <FormLabel
      className={cn(
        "after:content-['*'] after:text-sm after:text-red-500 after:-ml-1",
        className
      )}
    >
      {title}
    </FormLabel>
  );
};
