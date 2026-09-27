import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { ThemeProvider } from "@/theme";

import { createAppQueryClient } from "./query-client";

export type AppProvidersProps = PropsWithChildren;

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(createAppQueryClient);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
