import { useStore } from "zustand";

import type { SearchResult } from "@/features/discovery";

import { createSessionStore, type SessionStore } from "./create-session-store";

export type ConverterHandoff = {
  requestId: string;
  youtubeUrl: string;
  selectedAt: number;
};

export type ConverterHandoffState = {
  handoff?: ConverterHandoff;
  sendToConverter(result: SearchResult): ConverterHandoff;
  clearHandoff(requestId: string): void;
};

export type ConverterHandoffStoreOptions = {
  now?: () => number;
};

function createRequestIdGenerator(now: () => number) {
  let counter = 0;
  let lastTimestamp = 0;

  return () => {
    const selectedAt = now();
    const timestamp = Math.max(selectedAt, lastTimestamp);

    if (timestamp > lastTimestamp) {
      lastTimestamp = timestamp;
      counter = 0;
    }

    counter += 1;

    return {
      requestId: `${timestamp}-${counter}`,
      selectedAt,
    };
  };
}

export function createConverterHandoffStore(
  options: ConverterHandoffStoreOptions = {},
): SessionStore<ConverterHandoffState> {
  const nextRequest = createRequestIdGenerator(options.now ?? Date.now);

  return createSessionStore<ConverterHandoffState>((set) => ({
    handoff: undefined,
    sendToConverter(result) {
      const request = nextRequest();
      const handoff: ConverterHandoff = {
        ...request,
        youtubeUrl: result.canonicalUrl,
      };

      set({ handoff });
      return handoff;
    },
    clearHandoff(requestId) {
      set((state) =>
        state.handoff?.requestId === requestId
          ? { handoff: undefined }
          : state,
      );
    },
  }));
}

export const converterHandoffStore = createConverterHandoffStore();

export function useConverterHandoffStore<T>(
  selector: (state: ConverterHandoffState) => T,
): T {
  return useStore(converterHandoffStore, selector);
}
