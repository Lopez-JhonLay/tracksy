import { readFile } from "node:fs/promises";

const flow = await readFile(
  new URL("../e2e/tracksy-smoke.yaml", import.meta.url),
  "utf8",
);

const orderedMarkers = [
  "appId: com.jhonlaylopez.tracksy",
  "androidWebViewHierarchy: devtools",
  'text: "Search YouTube"',
  'inputText: "fixture"',
  'visible: "Tracksy Fixture One"',
  'text: "Use Tracksy Fixture One link"',
  'visible: "Converter test page"',
  "dQw4w9WgXcQ",
  'id: "discover-tab"',
  'text: "Use Tracksy Fixture Two link"',
  "M7lc1UVf-VE",
];

let cursor = -1;
for (const marker of orderedMarkers) {
  const index = flow.indexOf(marker, cursor + 1);
  if (index === -1) {
    throw new Error(`Missing or out-of-order Maestro marker: ${marker}`);
  }
  cursor = index;
}

const noSubmitAssertions = flow.match(
  /assertNotVisible: "Convert activated"/g,
);
if (noSubmitAssertions?.length !== 2) {
  throw new Error(
    "The Maestro flow must prove Convert stays untouched after both handoffs.",
  );
}

console.log("Tracksy Maestro flow structure is valid.");
