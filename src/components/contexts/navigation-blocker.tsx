"use client";

import { ConfirmResult, useConfirm } from "@/hooks/use-confirm";
import { createContext, useContext, useState } from "react";

interface NavigationBlockerContextProps {
  isBlocked: boolean;
  setIsBlocked: (isBlocked: boolean) => void;
  UnsavedDialog: () => React.ReactNode;
  confirmExit: () => Promise<ConfirmResult<never, undefined>>;
}

export const NavigationBlockerContext =
  createContext<NavigationBlockerContextProps>({
    isBlocked: false,
    setIsBlocked: () => {},
    UnsavedDialog: () => null,
    confirmExit: () => Promise.resolve({ action: "cancel" }),
  });

export const NavigationBlockerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [UnsavedDialog, confirmExit] = useConfirm({
    primaryText: "Leave",
    cancelText: "Stay",
    title: "Unsaved Changes",
    message:
      "You are about to leave this page. You have unsaved changes. Leave anyway?",
  });

  return (
    <NavigationBlockerContext.Provider
      value={{ isBlocked, setIsBlocked, UnsavedDialog, confirmExit }}
    >
      <UnsavedDialog />
      {children}
    </NavigationBlockerContext.Provider>
  );
};

export const useNavigationBlocker = () => {
  return useContext(NavigationBlockerContext);
};
