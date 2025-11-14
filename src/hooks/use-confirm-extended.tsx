import { cn } from "@/lib/utils";
import { ReactNode, SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { FieldValues, UseFormReturn } from "react-hook-form";

type ConfirmAction = "cancel" | "primary" | "secondary" | "confirm";

export interface ConfirmResult<FieldValues, Extra = undefined> {
  action: ConfirmAction;
  formValues?: FieldValues;
  extraValues?: Extra;
}

interface UseConfirmProps<T extends FieldValues, Extra> {
  title: string;
  message: string | ReactNode;
  update?: boolean;
  primaryText?: string;
  secondaryText?: string;
  cancelText?: string;

  // Optional react-hook-form support
  form?: UseFormReturn<T>;
  renderForm?: (form: UseFormReturn<T>) => ReactNode;

  // Optional custom typed content
  renderContent?: (props: {
    value: Extra;
    setValue: React.Dispatch<SetStateAction<Extra>>;
  }) => ReactNode;
  initialValue?: Extra;
}

export const useConfirmExtended = <
  T extends FieldValues = never,
  Extra = undefined,
>({
  title,
  message,
  update,
  primaryText,
  secondaryText,
  cancelText,
  form,
  renderForm,
  renderContent,
  initialValue,
}: UseConfirmProps<T, Extra>): [
  () => ReactNode,
  () => Promise<ConfirmResult<FieldValues, Extra>>,
] => {
  const [promiseObj, setPromiseObj] = useState<{
    resolve: (value: ConfirmResult<FieldValues, Extra>) => void;
  } | null>(null);

  const [extraValue, setExtraValue] = useState<Extra>(
    initialValue ?? ({} as Extra)
  );

  const confirm = (): Promise<ConfirmResult<FieldValues, Extra>> => {
    return new Promise((resolve) => setPromiseObj({ resolve }));
  };

  const handleClose = (): void => {
    setPromiseObj(null);
  };

  const handleAction = async (action: ConfirmAction): Promise<void> => {
    if (!promiseObj) return;

    if (form) {
      if (["confirm", "primary", "secondary"].includes(action)) {
        const isValid = await form.trigger();
        if (!isValid) return; // Keep dialog open on validation error

        const formValues = form.getValues();
        promiseObj.resolve({ action, formValues, extraValues: extraValue });
      } else {
        promiseObj.resolve({ action });
      }
    } else {
      promiseObj.resolve({ action, extraValues: extraValue });
    }

    handleClose();
  };

  // Check if we're using the three-button mode
  const isThreeButtonMode = Boolean(primaryText && secondaryText);

  const ConfirmDialog = () => (
    <Dialog open={promiseObj !== null} onOpenChange={handleClose}>
      <DialogContent className="mx-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        {/* Render custom content above or with the form */}
        {renderContent && (
          <div className="py-4">
            {renderContent({ value: extraValue, setValue: setExtraValue })}
          </div>
        )}

        {form && renderForm ? (
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleAction("confirm");
              }}
              className="space-y-6"
            >
              {renderForm(form)}

              <DialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleAction("cancel")}
                >
                  {cancelText ?? "Cancel"}
                </Button>

                {isThreeButtonMode ? (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => void handleAction("primary")}
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      {primaryText}
                    </Button>
                    <Button
                      type="submit"
                      variant={update ? "default" : "destructive"}
                      className={cn(
                        update &&
                          "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                      )}
                    >
                      {secondaryText}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    variant={update ? "default" : "destructive"}
                    className={cn(
                      update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                    )}
                  >
                    {secondaryText || primaryText || "Confirm"}
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => void handleAction("cancel")}
            >
              {cancelText ?? "Cancel"}
            </Button>

            {isThreeButtonMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => void handleAction("primary")}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  {primaryText}
                </Button>
                <Button
                  variant={update ? "default" : "destructive"}
                  onClick={() => void handleAction("secondary")}
                  className={cn(
                    update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                  )}
                >
                  {secondaryText}
                </Button>
              </>
            ) : (
              <Button
                variant={update ? "default" : "destructive"}
                onClick={() => void handleAction("confirm")}
                className={cn(
                  update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                )}
              >
                {secondaryText || primaryText || "Confirm"}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};
