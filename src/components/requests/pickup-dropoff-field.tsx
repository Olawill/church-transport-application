import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Path, UseFormReturn } from "react-hook-form";

type PickUpDropOffFormFields = {
  isPickUp: boolean;
  isDropOff: boolean;
};

interface PickUpDropOffFieldProps<T extends PickUpDropOffFormFields> {
  form: UseFormReturn<T>;
}

export const PickUpDropOffField = <T extends PickUpDropOffFormFields>({
  form,
}: PickUpDropOffFieldProps<T>) => {
  return (
    <>
      {/* PickUp Service */}
      <FormField
        control={form.control}
        name={"isPickUp" as Path<T>}
        render={({ field }) => (
          <FormItem className="space-x-2">
            <div className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    // Prevent unchecking if the other option is also unchecked
                    const otherField = "isDropOff" as Path<T>;
                    if (!checked && !form.getValues(otherField)) {
                      return; // Don't allow unchecking both
                    }
                    field.onChange(checked);
                  }}
                  id="isPickUp"
                />
              </FormControl>
              <FormLabel>Pickup Service</FormLabel>
            </div>
            <FormMessage />
            <FormDescription className="text-xs text-gray-500">
              Select if you need a pickup service to the church
            </FormDescription>
          </FormItem>
        )}
      />

      {/* DropOff Service */}
      <FormField
        control={form.control}
        name={"isDropOff" as Path<T>}
        render={({ field }) => (
          <FormItem className="space-x-2">
            <div className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    // Prevent unchecking if the other option is also unchecked
                    const otherField = "isPickUp" as Path<T>;
                    if (!checked && !form.getValues(otherField)) {
                      return; // Don't allow unchecking both
                    }
                    field.onChange(checked);
                  }}
                  id="isDropOff"
                />
              </FormControl>
              <FormLabel>Drop-off Service</FormLabel>
            </div>
            <FormMessage />
            <FormDescription className="text-xs text-gray-500">
              Select if you need a drop off after service from church
            </FormDescription>
          </FormItem>
        )}
      />
    </>
  );
};
