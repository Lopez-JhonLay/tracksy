import { z } from "zod";

export const CONVERTER_ORIGIN = "https://junkyardpizzeria.ca";

const injectionResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      requestId: z.string().min(1),
      status: z.literal("filled"),
    })
    .strict(),
  z
    .object({
      requestId: z.string().min(1),
      status: z.enum(["wrong_origin", "field_missing", "script_error"]),
    })
    .strict(),
]);

export type InjectionResult = z.infer<typeof injectionResultSchema>;

export type ConverterInjection = {
  requestId: string;
  youtubeUrl: string;
};

export function isTrustedConverterOrigin(url: string): boolean {
  try {
    return new URL(url).origin === CONVERTER_ORIGIN;
  } catch {
    return false;
  }
}

export function parseInjectionResult(data: string): InjectionResult | null {
  try {
    const parsed: unknown = JSON.parse(data);
    const result = injectionResultSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function parseTrustedInjectionResult(
  data: string,
  mainFrameUrl: string,
): InjectionResult | null {
  if (!isTrustedConverterOrigin(mainFrameUrl)) {
    return null;
  }

  return parseInjectionResult(data);
}

export function buildConverterInjectionScript({
  requestId,
  youtubeUrl,
}: ConverterInjection): string {
  const serializedRequestId = JSON.stringify(requestId);
  const serializedYoutubeUrl = JSON.stringify(youtubeUrl);
  const serializedTrustedOrigin = JSON.stringify(CONVERTER_ORIGIN);

  return `
(function () {
  var requestId = ${serializedRequestId};
  var youtubeUrl = ${serializedYoutubeUrl};
  var trustedOrigin = ${serializedTrustedOrigin};
  var report = function (status) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      requestId: requestId,
      status: status
    }));
  };

  try {
    if (window.location.origin !== trustedOrigin) {
      report("wrong_origin");
      return;
    }

    var input = document.querySelector("#url");
    if (!(input instanceof HTMLInputElement)) {
      report("field_missing");
      return;
    }

    var valueDescriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    );
    if (!valueDescriptor || typeof valueDescriptor.set !== "function") {
      throw new Error("Native input value setter is unavailable.");
    }

    valueDescriptor.set.call(input, youtubeUrl);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    report("filled");
  } catch (_error) {
    report("script_error");
  }
})();
true;
`;
}
