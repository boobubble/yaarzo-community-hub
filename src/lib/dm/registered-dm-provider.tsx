import { createContext, useContext, type ReactNode } from "react";

import { useAuth } from "@/contexts/auth-context";
import { useRegisteredDm } from "@/lib/dm/use-registered-dm";

type RegisteredDmContextValue = ReturnType<typeof useRegisteredDm>;

const RegisteredDmContext = createContext<RegisteredDmContextValue | null>(null);

export function RegisteredDmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const value = useRegisteredDm(user?.id);
  return <RegisteredDmContext.Provider value={value}>{children}</RegisteredDmContext.Provider>;
}

export function useRegisteredDmContext() {
  const ctx = useContext(RegisteredDmContext);
  if (!ctx) throw new Error("useRegisteredDmContext must be used within RegisteredDmProvider");
  return ctx;
}
