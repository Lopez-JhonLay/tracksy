import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createAppQueryClient } from "../src/providers/query-client.ts";
import { createSessionStore } from "../src/store/create-session-store.ts";

const firstQueryClient = createAppQueryClient();
const secondQueryClient = createAppQueryClient();

assert.notEqual(firstQueryClient, secondQueryClient);
firstQueryClient.setQueryData(["session-check"], "first");
assert.equal(
  firstQueryClient.getQueryData(["session-check"]),
  "first",
);
assert.equal(
  secondQueryClient.getQueryData(["session-check"]),
  undefined,
);

function createCounterStore() {
  return createSessionStore((set) => ({
    count: 0,
    increment: () =>
      set((state) => ({ count: state.count + 1 })),
  }));
}

const firstStore = createCounterStore();
const secondStore = createCounterStore();

firstStore.getState().increment();
assert.equal(firstStore.getState().count, 1);
assert.equal(secondStore.getState().count, 0);

const tsconfig = JSON.parse(
  await readFile(new URL("../tsconfig.json", import.meta.url), "utf8"),
);

assert.deepEqual(tsconfig.compilerOptions.paths, {
  "@/*": ["./src/*"],
});

console.log(
  "Provider, query-cache, session-store, and source-alias foundations verified.",
);
