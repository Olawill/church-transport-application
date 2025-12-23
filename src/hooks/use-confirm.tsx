import { cn } from "@/lib/utils";
import { ReactNode, SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { Form } from "@/components/ui/form";

type ConfirmAction = "cancel" | "primary" | "secondary" | "confirm";

export interface ConfirmResult<FieldValues, Extra = undefined> {
  action: ConfirmAction;
  formValues?: FieldValues;
  extraValues?: Extra;
}

interface UseConfirmProps<T extends FieldValues, Extra> {
  title: string;
  message: string;
  update?: boolean;
  primaryText?: string;
  secondaryText?: string;
  cancelText?: string;

  //Optional react hook form support
  form?: UseFormReturn<T>;
  renderForm?: (form: UseFormReturn<T>) => ReactNode;

  // Optional custom typed content
  initialValue?: Extra;
  renderContent?: (props: {
    value: Extra;
    setValue: React.Dispatch<SetStateAction<Extra>>;
  }) => ReactNode;
}

// Overload for exposeValue = true
export function useConfirm<T extends FieldValues = never, Extra = undefined>(
  props: UseConfirmProps<T, Extra> & { exposeValue: true }
): [
  Dialog: () => React.ReactNode,
  confirm: () => Promise<ConfirmResult<T, Extra>>,
  setValue: React.Dispatch<SetStateAction<Extra>>,
];

// Overload for exposeValue not true or undefined
export function useConfirm<T extends FieldValues = never, Extra = undefined>(
  props: UseConfirmProps<T, Extra> & { exposeValue?: false }
): [
  Dialog: () => React.ReactNode,
  confirm: () => Promise<ConfirmResult<T, Extra>>,
];

export function useConfirm<T extends FieldValues = never, Extra = undefined>({
  title,
  message,
  update,
  primaryText,
  secondaryText,
  cancelText,
  form,
  renderForm,
  initialValue,
  renderContent,
  exposeValue,
}: UseConfirmProps<T, Extra> & {
  exposeValue?: boolean;
}) {
  const [promise, setPromise] = useState<{
    resolve: (value: ConfirmResult<FieldValues, Extra>) => void;
  } | null>(null);

  const [extraValue, setExtraValue] = useState<Extra>(
    initialValue ?? ({} as Extra)
  );

  const confirm = (): Promise<ConfirmResult<FieldValues, Extra>> => {
    return new Promise((resolve) => setPromise({ resolve }));
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleAction = async (action: ConfirmAction) => {
    if (!promise) return;

    if (form) {
      if (["confirm", "primary", "secondary"].includes(action)) {
        const isValid = await form.trigger();

        if (!isValid) return; // Keep dialog open on validation error

        const formValues = form.getValues();

        promise.resolve({ action, formValues, extraValues: extraValue });
      } else {
        promise.resolve({ action });
      }
    } else {
      promise.resolve({ action, extraValues: extraValue });
    }

    handleClose();
  };

  // Check if we're using the three-button mode
  const isThreeButtonMode = Boolean(primaryText && secondaryText);

  const ConfirmDialog = () => (
    <AlertDialog open={promise !== null} onOpenChange={handleClose}>
      <AlertDialogContent className="mx-8 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* Render custom content */}
        {renderContent && (
          <div className="py-4">
            {renderContent({
              value: extraValue,
              setValue: setExtraValue,
            })}
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

              <AlertDialogFooter className="pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleAction("cancel")}
                >
                  {cancelText || "Cancel"}
                </Button>

                {isThreeButtonMode ? (
                  // Three-button mode: Cancel, Primary, Secondary
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => void handleAction("primary")}
                      className={cn(
                        "border-blue-500 text-blue-600 hover:bg-blue-50 cursor-pointer",
                        !update && "border-red-500 text-red-500 hover:bg-red-50"
                      )}
                    >
                      {primaryText}
                    </Button>
                    <Button
                      variant={update ? "default" : "destructive"}
                      type="submit"
                      className={cn(
                        "cursor-pointer",
                        update &&
                          "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                      )}
                    >
                      {secondaryText}
                    </Button>
                  </>
                ) : (
                  // Two-button mode: Cancel, Confirm (original behavior)
                  <Button
                    variant={update ? "default" : "destructive"}
                    type="submit"
                    className={cn(
                      update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                    )}
                  >
                    {secondaryText || primaryText || "Confirm"}
                  </Button>
                )}
              </AlertDialogFooter>
            </form>
          </Form>
        ) : (
          <AlertDialogFooter className="pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => void handleAction("cancel")}
              className="cursor-pointer"
            >
              {cancelText || "Cancel"}
            </Button>

            {isThreeButtonMode ? (
              // Three-button mode: Cancel, Primary, Secondary
              <>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => void handleAction("primary")}
                  className={cn(
                    "border-blue-500 text-blue-600 hover:bg-blue-50 cursor-pointer",
                    !update && "border-red-500 text-red-500 hover:bg-red-50"
                  )}
                >
                  {primaryText}
                </Button>
                <Button
                  type="button"
                  variant={update ? "default" : "destructive"}
                  onClick={() => void handleAction("secondary")}
                  className={cn(
                    "cursor-pointer",
                    update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                  )}
                >
                  {secondaryText}
                </Button>
              </>
            ) : (
              // Two-button mode: Cancel, Confirm (original behavior)
              <Button
                variant={update ? "default" : "destructive"}
                type="button"
                onClick={() => void handleAction("confirm")}
                className={cn(
                  "cursor-pointer",
                  update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
                )}
              >
                {secondaryText || primaryText || "Confirm"}
              </Button>
            )}
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );

  // Return proper tuple based on overload
  if (exposeValue) {
    const tuple: [
      () => React.ReactNode,
      () => Promise<ConfirmResult<FieldValues, Extra>>,
      React.Dispatch<SetStateAction<Extra>>,
    ] = [ConfirmDialog, confirm, setExtraValue];
    return tuple;
  }

  const tuple: [
    () => React.ReactNode,
    () => Promise<ConfirmResult<FieldValues, Extra>>,
  ] = [ConfirmDialog, confirm];
  return tuple;
}
