import type { SearchResult } from "@/features/discovery";

export type ClipboardStatus = "copied" | "unavailable";
export type ConverterOpenStatus = "opened" | "unavailable";

export type UseLinkResult = {
  clipboardStatus: ClipboardStatus;
  converterOpenStatus: ConverterOpenStatus;
  youtubeUrl: string;
};

export type UseVideoLink = (result: SearchResult) => Promise<UseLinkResult>;

export type CopyAndOpenVideoDependencies = {
  copyToClipboard(value: string): Promise<boolean>;
  openConverter(): Promise<boolean>;
};

export async function copyAndOpenVideo(
  result: SearchResult,
  dependencies: CopyAndOpenVideoDependencies,
): Promise<UseLinkResult> {
  const youtubeUrl = result.canonicalUrl;
  let clipboardStatus: ClipboardStatus = "copied";

  try {
    if (!(await dependencies.copyToClipboard(youtubeUrl))) {
      clipboardStatus = "unavailable";
    }
  } catch {
    clipboardStatus = "unavailable";
  }

  let converterOpenStatus: ConverterOpenStatus = "opened";
  try {
    if (!(await dependencies.openConverter())) {
      converterOpenStatus = "unavailable";
    }
  } catch {
    converterOpenStatus = "unavailable";
  }

  return { clipboardStatus, converterOpenStatus, youtubeUrl };
}
