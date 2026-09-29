import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createAppQueryClient } from "../src/providers/query-client.ts";

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

const tsconfig = JSON.parse(
  await readFile(new URL("../tsconfig.json", import.meta.url), "utf8"),
);

assert.deepEqual(tsconfig.compilerOptions.paths, {
  "@/*": ["./src/*"],
});

console.log(
  "Provider, query-cache, and source-alias foundations verified.",
);
