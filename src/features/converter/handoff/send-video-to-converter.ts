import type { SearchResult } from "@/features/discovery";
import type { ConverterHandoff } from "@/store";

export type ClipboardStatus = "copied" | "unavailable";

export type UseLinkResult = {
  handoff: ConverterHandoff;
  clipboardStatus: ClipboardStatus;
};

export type UseVideoLink = (
  result: SearchResult,
) => Promise<UseLinkResult>;

export type SendVideoToConverterDependencies = {
  copyToClipboard(value: string): Promise<boolean>;
  navigateToDownload(): void;
  sendToConverter(result: SearchResult): ConverterHandoff;
};

export async function sendVideoToConverter(
  result: SearchResult,
  dependencies: SendVideoToConverterDependencies,
): Promise<UseLinkResult> {
  const handoff = dependencies.sendToConverter(result);
  let clipboardStatus: ClipboardStatus = "copied";

  try {
    const copied = await dependencies.copyToClipboard(handoff.youtubeUrl);
    if (!copied) {
      clipboardStatus = "unavailable";
    }
  } catch {
    clipboardStatus = "unavailable";
  }

  dependencies.navigateToDownload();

  return { handoff, clipboardStatus };
}
