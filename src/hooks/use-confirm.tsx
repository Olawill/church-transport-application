import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";

export const useConfirm = (
  title: string,
  message: string,
  update?: boolean,
  cancelText?: string,
  confirmText?: string
): [() => ReactNode, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise((resolve) => setPromise({ resolve }));
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleCancel}>
      <DialogContent className="mx-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleCancel}>
            {cancelText || "Cancel"}
          </Button>
          <Button
            variant={update ? "default" : "destructive"}
            onClick={handleConfirm}
            className={cn(
              update && "bg-[#007A5A] hover:bg-[#007A5A]/80 text-white"
            )}
          >
            {confirmText ? confirmText : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};
