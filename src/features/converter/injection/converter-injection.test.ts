import {
  buildConverterInjectionScript,
  CONVERTER_ORIGIN,
  isTrustedConverterOrigin,
  parseInjectionResult,
  parseTrustedInjectionResult,
  type InjectionResult,
} from "./converter-injection";

type ScriptEnvironmentOptions = {
  input?: FakeInput | null;
  origin?: string;
  setterThrows?: boolean;
};

class FakeEvent {
  constructor(
    readonly type: string,
    readonly options: { bubbles?: boolean } = {},
  ) {}
}

class FakeInput {
  readonly events: FakeEvent[] = [];
  storedValue = "";

  dispatchEvent(event: FakeEvent) {
    this.events.push(event);
    return true;
  }
}

function runScript(
  script: string,
  {
    input = new FakeInput(),
    origin = CONVERTER_ORIGIN,
    setterThrows = false,
  }: ScriptEnvironmentOptions = {},
) {
  Object.defineProperty(FakeInput.prototype, "value", {
    configurable: true,
    set(value: string) {
      if (setterThrows) {
        throw new Error("setter failed");
      }
      this.storedValue = value;
    },
  });

  const messages: string[] = [];
  const querySelector = jest.fn(() => input);
  const execute = Function(
    "window",
    "document",
    "HTMLInputElement",
    "Event",
    "script",
    "return eval(script);",
  );
  const completion = execute(
    {
      location: { origin },
      ReactNativeWebView: {
        postMessage(message: string) {
          messages.push(message);
        },
      },
    },
    { querySelector },
    FakeInput,
    FakeEvent,
    script,
  );

  return {
    completion,
    input,
    messages: messages.map(
      (message) => JSON.parse(message) as InjectionResult,
    ),
    querySelector,
  };
}

describe("converter injection", () => {
  it("fills through the native setter and dispatches bubbling events", () => {
    const youtubeUrl = "https://www.youtube.com/watch?v=abcdefghijk";
    const execution = runScript(
      buildConverterInjectionScript({
        requestId: "42-1",
        youtubeUrl,
      }),
    );

    expect(execution.completion).toBe(true);
    expect(execution.input?.storedValue).toBe(youtubeUrl);
    expect(execution.input?.events).toEqual([
      expect.objectContaining({ type: "input", options: { bubbles: true } }),
      expect.objectContaining({ type: "change", options: { bubbles: true } }),
    ]);
    expect(execution.messages).toEqual([
      { requestId: "42-1", status: "filled" },
    ]);
    expect(execution.querySelector).toHaveBeenCalledWith("#url");
  });

  it("serializes request values without executing injected source text", () => {
    const requestId = 'request";globalThis.compromised=true;//';
    const youtubeUrl =
      'https://www.youtube.com/watch?v=abc"&globalThis.compromised=true';
    const execution = runScript(
      buildConverterInjectionScript({ requestId, youtubeUrl }),
    );

    expect(execution.input?.storedValue).toBe(youtubeUrl);
    expect(execution.messages).toEqual([
      { requestId, status: "filled" },
    ]);
  });

  it("reports wrong_origin before reading the document", () => {
    const execution = runScript(
      buildConverterInjectionScript({
        requestId: "42-1",
        youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      }),
      { origin: "https://example.com" },
    );

    expect(execution.messages).toEqual([
      { requestId: "42-1", status: "wrong_origin" },
    ]);
    expect(execution.querySelector).not.toHaveBeenCalled();
  });

  it("reports field_missing when #url is absent", () => {
    const execution = runScript(
      buildConverterInjectionScript({
        requestId: "42-1",
        youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      }),
      { input: null },
    );

    expect(execution.messages).toEqual([
      { requestId: "42-1", status: "field_missing" },
    ]);
  });

  it("reports script_error when the native setter fails", () => {
    const execution = runScript(
      buildConverterInjectionScript({
        requestId: "42-1",
        youtubeUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      }),
      { setterThrows: true },
    );

    expect(execution.messages).toEqual([
      { requestId: "42-1", status: "script_error" },
    ]);
  });
});

describe("converter injection validation", () => {
  it.each([
    "https://junkyardpizzeria.ca",
    "https://junkyardpizzeria.ca/",
    "https://junkyardpizzeria.ca/converter?source=tracksy",
  ])("accepts the exact trusted origin for %s", (url) => {
    expect(isTrustedConverterOrigin(url)).toBe(true);
  });

  it.each([
    "http://junkyardpizzeria.ca",
    "https://junkyardpizzeria.ca.evil.example",
    "https://evil.example/junkyardpizzeria.ca",
    "javascript:alert(1)",
    "not a url",
  ])("rejects an origin mismatch for %s", (url) => {
    expect(isTrustedConverterOrigin(url)).toBe(false);
  });

  it.each([
    { requestId: "42-1", status: "filled" },
    { requestId: "42-1", status: "wrong_origin" },
    { requestId: "42-1", status: "field_missing" },
    { requestId: "42-1", status: "script_error" },
  ] as const)("parses the $status result", (result) => {
    expect(parseInjectionResult(JSON.stringify(result))).toEqual(result);
  });

  it.each([
    "not JSON",
    "null",
    "{}",
    '{"requestId":"","status":"filled"}',
    '{"requestId":"42-1","status":"unknown"}',
    '{"requestId":"42-1","status":"filled","action":"navigate"}',
  ])("rejects invalid message %s", (message) => {
    expect(parseInjectionResult(message)).toBeNull();
  });

  it("ignores valid messages received on an untrusted main-frame origin", () => {
    const data = JSON.stringify({
      requestId: "42-1",
      status: "filled",
    });

    expect(
      parseTrustedInjectionResult(data, "https://example.com"),
    ).toBeNull();
    expect(
      parseTrustedInjectionResult(
        data,
        "https://junkyardpizzeria.ca/converter",
      ),
    ).toEqual({ requestId: "42-1", status: "filled" });
  });
});
