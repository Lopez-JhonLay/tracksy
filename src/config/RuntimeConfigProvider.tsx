import { createContext, useContext, type PropsWithChildren } from "react";

import { runtimeConfig, type RuntimeConfigResult } from "./runtime-config";

const RuntimeConfigContext = createContext<RuntimeConfigResult | undefined>(undefined);

export type RuntimeConfigProviderProps = PropsWithChildren;

export function RuntimeConfigProvider({ children }: RuntimeConfigProviderProps) {
  return (
    <RuntimeConfigContext.Provider value={runtimeConfig}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig(): RuntimeConfigResult {
  const value = useContext(RuntimeConfigContext);

  if (!value) {
    throw new Error("useRuntimeConfig must be used within RuntimeConfigProvider");
  }

  return value;
}
