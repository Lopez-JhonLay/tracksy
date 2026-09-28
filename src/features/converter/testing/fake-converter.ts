import { CONVERTER_ORIGIN } from "../injection";

export const FAKE_CONVERTER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tracksy Converter Fixture</title>
    <style>
      body { font-family: sans-serif; margin: 24px; color: #171824; }
      label, input, button, output { display: block; width: 100%; }
      input, button { box-sizing: border-box; min-height: 48px; margin-top: 8px; }
      output { margin-top: 16px; }
    </style>
  </head>
  <body>
    <h1>Converter test page</h1>
    <label for="url">YouTube URL</label>
    <input id="url" autocomplete="off" />
    <button id="convert" type="button">Convert</button>
    <output id="status" aria-live="polite">Waiting for Tracksy link</output>
    <script>
      const input = document.getElementById("url");
      const status = document.getElementById("status");
      input.addEventListener("input", () => {
        status.textContent = "Link ready; Convert was not pressed";
      });
      document.getElementById("convert").addEventListener("click", () => {
        status.textContent = "Convert activated";
      });
    </script>
  </body>
</html>`;

export const FAKE_CONVERTER_SOURCE = {
  html: FAKE_CONVERTER_HTML,
  baseUrl: `${CONVERTER_ORIGIN}/`,
} as const;
