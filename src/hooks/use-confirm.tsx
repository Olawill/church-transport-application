import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmResult = "cancel" | "primary" | "secondary" | "confirm";

export const useConfirm = (
  title: string,
  message: string,
  update?: boolean,
  primaryText?: string,
  secondaryText?: string
): [() => ReactNode, () => Promise<ConfirmResult>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: ConfirmResult) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise<ConfirmResult>((resolve) => setPromise({ resolve }));
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve("cancel");
    handleClose();
  };

  const handlePrimary = () => {
    promise?.resolve("primary");
    handleClose();
  };

  const handleSecondary = () => {
    promise?.resolve("secondary");
    handleClose();
  };

  const handleConfirm = () => {
    promise?.resolve("confirm");
    handleClose();
  };

  // Check if we're using the three-button mode
  const isThreeButtonMode = !!(primaryText && secondaryText);

  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleCancel}>
      <DialogContent className="mx-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>

          {isThreeButtonMode ? (
            // Three-button mode: Cancel, Primary, Secondary
            <>
              <Button
                variant="outline"
                onClick={handlePrimary}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                {primaryText}
              </Button>
              <Button
                variant={update ? "default" : "destructive"}
                onClick={handleSecondary}
                className={cn(
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
              onClick={handleConfirm}
              className={cn(
                update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
              )}
            >
              {secondaryText || primaryText || "Confirm"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};
