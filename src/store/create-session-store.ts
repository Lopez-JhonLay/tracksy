import {
  createStore,
  type StateCreator,
  type StoreApi,
} from "zustand/vanilla";

export type SessionStore<TState> = StoreApi<TState>;

export function createSessionStore<TState>(
  initializer: StateCreator<TState, [], []>,
): SessionStore<TState> {
  return createStore<TState>()(initializer);
}
