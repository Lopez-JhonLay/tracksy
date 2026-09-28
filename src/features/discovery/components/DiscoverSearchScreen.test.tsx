import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert, ToastAndroid } from "react-native";

import type { UseVideoLink } from "@/features/converter";
import { ThemeProvider } from "@/theme";

import { YouTubeApiError, type YouTubeApiAdapter } from "../api";
import type { SearchPage, SearchResult } from "../contracts";
import type { OpenYouTubeVideo } from "../external-linking";
import { DiscoverSearchScreen } from "./DiscoverSearchScreen";

const LOCALE = { regionCode: "PH", relevanceLanguage: "en" };

function result(
  videoId: string,
  title: string,
  options: {
    channelTitle?: string;
    durationSeconds?: number;
  } = {},
): SearchResult {
  return {
    videoId,
    title,
    channelTitle: options.channelTitle ?? "Channel",
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    ...(options.durationSeconds === undefined
      ? {}
      : { durationSeconds: options.durationSeconds }),
  };
}

function createAdapter(
  search: YouTubeApiAdapter["search"],
): YouTubeApiAdapter {
  return { search };
}

async function renderScreen(
  adapter: YouTubeApiAdapter | null,
  openVideo?: OpenYouTubeVideo,
  useLink?: UseVideoLink,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider themeName="light">{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }

  const rendered = await render(
    <DiscoverSearchScreen
      adapter={adapter}
      locale={LOCALE}
      openVideo={openVideo}
      useLink={useLink}
    />,
    { wrapper: Wrapper },
  );

  return {
    ...rendered,
    queryClient,
  };
}

type RenderedScreen = Awaited<ReturnType<typeof renderScreen>>;

async function submit(screen: RenderedScreen, query = "lo-fi") {
  await fireEvent.changeText(screen.getByLabelText("Search YouTube"), query);
  await fireEvent.press(screen.getByRole("button", { name: "Search" }));
}

async function cleanupScreen(screen: RenderedScreen) {
  await screen.unmount();
  screen.queryClient.clear();
}

describe("DiscoverSearchScreen", () => {
  it("searches only after explicit submission and renders results", async () => {
    const search = jest.fn(async (): Promise<SearchPage> => ({
      items: [result("abcdefghijk", "Lo-fi mix")],
    }));
    const screen = await renderScreen(createAdapter(search));

    await fireEvent.changeText(screen.getByLabelText("Search YouTube"), "lo-fi");
    expect(search).not.toHaveBeenCalled();

    await fireEvent(screen.getByLabelText("Search YouTube"), "submitEditing");

    await waitFor(() => expect(screen.getByText("Lo-fi mix")).toBeTruthy());
    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ query: "lo-fi", locale: LOCALE }),
    );
    await cleanupScreen(screen);
  });

  it("shows validation without calling the adapter", async () => {
    const search = jest.fn();
    const screen = await renderScreen(createAdapter(search));

    await submit(screen, "x");

    expect(screen.getByText("Enter at least two characters to search.")).toBeTruthy();
    expect(search).not.toHaveBeenCalled();
    await cleanupScreen(screen);
  });

  it("shows native skeleton rows while the first search is loading", async () => {
    const search = jest.fn(
      ({ signal }: Parameters<YouTubeApiAdapter["search"]>[0]) =>
        new Promise<SearchPage>((_resolve, reject) => {
          signal?.addEventListener("abort", () => {
            reject(new YouTubeApiError("cancelled", { retryable: false }));
          });
        }),
    );
    const screen = await renderScreen(createAdapter(search));

    await submit(screen);

    expect(screen.getByLabelText("Loading search results")).toBeTruthy();
    await cleanupScreen(screen);
  });

  it("shows an empty state after a successful search", async () => {
    const screen = await renderScreen(
      createAdapter(jest.fn(async () => ({ items: [] }))),
    );

    await submit(screen);

    await waitFor(() => expect(screen.getByText("No videos found")).toBeTruthy());
    await cleanupScreen(screen);
  });

  it("shows channel metadata and formats optional durations", async () => {
    const screen = await renderScreen(
      createAdapter(
        jest.fn(async () => ({
          items: [
            result("abcdefghijk", "With duration", {
              channelTitle: "First channel",
              durationSeconds: 65,
            }),
            result("lmnopqrstuv", "Without duration", {
              channelTitle: "Second channel",
            }),
          ],
        })),
      ),
    );

    await submit(screen);

    await waitFor(() =>
      expect(screen.getByText("First channel • 1:05")).toBeTruthy(),
    );
    expect(screen.getByText("Second channel")).toBeTruthy();
    expect(screen.queryByText("Second channel •")).toBeNull();
    await cleanupScreen(screen);
  });

  it("opens a result externally through the injected YouTube action", async () => {
    const openVideo = jest.fn(async (videoId: string) => ({
      status: "opened" as const,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    }));
    const screen = await renderScreen(
      createAdapter(
        jest.fn(async () => ({
          items: [result("abcdefghijk", "Open me")],
        })),
      ),
      openVideo,
    );

    await submit(screen);
    const openButton = await waitFor(() =>
      screen.getByRole("button", { name: "Open Open me in YouTube" }),
    );
    await fireEvent.press(openButton);

    await waitFor(() =>
      expect(openVideo).toHaveBeenCalledWith("abcdefghijk"),
    );
    await cleanupScreen(screen);
  });

  it("reports when no external handler can open a result", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const openVideo = jest.fn(async () => ({
      status: "unavailable" as const,
    }));
    const screen = await renderScreen(
      createAdapter(
        jest.fn(async () => ({
          items: [result("abcdefghijk", "Unavailable video")],
        })),
      ),
      openVideo,
    );

    await submit(screen);
    const openButton = await waitFor(() =>
      screen.getByRole("button", {
        name: "Open Unavailable video in YouTube",
      }),
    );
    await fireEvent.press(openButton);

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Unable to open YouTube",
        "No YouTube app or browser could open this video.",
      ),
    );
    alert.mockRestore();
    await cleanupScreen(screen);
  });

  it("sends a result to the converter from Use Link", async () => {
    const selectedResult = result("abcdefghijk", "Use this link");
    const useLink = jest.fn(async () => ({
      handoff: {
        requestId: "42-1",
        youtubeUrl: selectedResult.canonicalUrl,
        selectedAt: 42,
      },
      clipboardStatus: "copied" as const,
    }));
    const screen = await renderScreen(
      createAdapter(
        jest.fn(async () => ({
          items: [selectedResult],
        })),
      ),
      undefined,
      useLink,
    );

    await submit(screen);
    const useLinkButton = await waitFor(() =>
      screen.getByRole("button", { name: "Use Use this link link" }),
    );
    await fireEvent.press(useLinkButton);

    await waitFor(() => expect(useLink).toHaveBeenCalledWith(selectedResult));
    await cleanupScreen(screen);
  });

  it("reports a clipboard failure without blocking the converter handoff", async () => {
    const selectedResult = result("abcdefghijk", "Clipboard fallback");
    const toast = jest
      .spyOn(ToastAndroid, "show")
      .mockImplementation(() => undefined);
    const useLink = jest.fn(async () => ({
      handoff: {
        requestId: "42-1",
        youtubeUrl: selectedResult.canonicalUrl,
        selectedAt: 42,
      },
      clipboardStatus: "unavailable" as const,
    }));
    const screen = await renderScreen(
      createAdapter(
        jest.fn(async () => ({
          items: [selectedResult],
        })),
      ),
      undefined,
      useLink,
    );

    await submit(screen);
    const useLinkButton = await waitFor(() =>
      screen.getByRole("button", { name: "Use Clipboard fallback link" }),
    );
    await fireEvent.press(useLinkButton);

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        "Link sent, but it could not be copied to the clipboard.",
        ToastAndroid.SHORT,
      ),
    );
    expect(useLink).toHaveBeenCalledWith(selectedResult);
    toast.mockRestore();
    await cleanupScreen(screen);
  });

  it("loads pages only from Load More and appends unique results", async () => {
    const search = jest
      .fn<ReturnType<YouTubeApiAdapter["search"]>, Parameters<YouTubeApiAdapter["search"]>>()
      .mockResolvedValueOnce({
        items: [result("abcdefghijk", "First result")],
        nextPageToken: "NEXT",
      })
      .mockResolvedValueOnce({
        items: [
          result("abcdefghijk", "Duplicate replacement"),
          result("lmnopqrstuv", "Second result"),
        ],
      });
    const screen = await renderScreen(createAdapter(search));

    await submit(screen);
    await waitFor(() => expect(screen.getByText("First result")).toBeTruthy());
    expect(search).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole("button", { name: "Load More" }));

    await waitFor(() => expect(screen.getByText("Second result")).toBeTruthy());
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ pageToken: "NEXT" }),
    );
    expect(screen.queryByText("Duplicate replacement")).toBeNull();
    expect(screen.queryByRole("button", { name: "Load More" })).toBeNull();
    await cleanupScreen(screen);
  });

  it("keeps results visible and disables Load More while paging", async () => {
    let resolveNextPage: (page: SearchPage) => void = () => undefined;
    const nextPage = new Promise<SearchPage>((resolve) => {
      resolveNextPage = resolve;
    });
    const search = jest
      .fn<ReturnType<YouTubeApiAdapter["search"]>, Parameters<YouTubeApiAdapter["search"]>>()
      .mockResolvedValueOnce({
        items: [result("abcdefghijk", "Existing result")],
        nextPageToken: "NEXT",
      })
      .mockReturnValueOnce(nextPage);
    const screen = await renderScreen(createAdapter(search));

    await submit(screen);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Load More" })).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Load More" }));

    const loadingButton = await waitFor(() =>
      screen.getByRole("button", {
        name: "Loading more results",
      }),
    );
    expect(loadingButton).toBeDisabled();
    expect(loadingButton.props.accessibilityState).toMatchObject({
      busy: true,
      disabled: true,
    });
    expect(screen.getByText("Existing result")).toBeTruthy();

    await act(async () => {
      resolveNextPage({ items: [result("lmnopqrstuv", "Loaded result")] });
    });
    await waitFor(() => expect(screen.getByText("Loaded result")).toBeTruthy());
    await cleanupScreen(screen);
  });

  it.each([
    ["offline", "You're offline", true],
    ["quota_exceeded", "Search limit reached", false],
    ["invalid_key", "Search needs configuration", false],
    ["service_unavailable", "YouTube is unavailable", true],
    ["unknown", "Search failed", true],
  ] as const)(
    "renders the %s state with the correct retry behavior",
    async (code, title, hasRetry) => {
      const error = new YouTubeApiError(code, { retryable: false });
      const screen = await renderScreen(
        createAdapter(jest.fn(async () => Promise.reject(error))),
      );

      await submit(screen);

      await waitFor(() => expect(screen.getByText(title)).toBeTruthy());
      expect(screen.queryByRole("button", { name: "Retry" }) !== null).toBe(
        hasRetry,
      );
      await cleanupScreen(screen);
    },
  );

  it("retries a failed search without changing the submitted query", async () => {
    const search = jest
      .fn<ReturnType<YouTubeApiAdapter["search"]>, Parameters<YouTubeApiAdapter["search"]>>()
      .mockRejectedValueOnce(
        new YouTubeApiError("unknown", { retryable: false }),
      )
      .mockResolvedValueOnce({ items: [result("abcdefghijk", "Recovered")] });
    const screen = await renderScreen(createAdapter(search));

    await submit(screen, "original query");
    await waitFor(() => expect(screen.getByText("Search failed")).toBeTruthy());

    await fireEvent.press(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByText("Recovered")).toBeTruthy());
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: "original query" }),
    );
    await cleanupScreen(screen);
  });

  it("keeps cached results visible when a refresh fails", async () => {
    const search = jest
      .fn<ReturnType<YouTubeApiAdapter["search"]>, Parameters<YouTubeApiAdapter["search"]>>()
      .mockResolvedValueOnce({ items: [result("abcdefghijk", "Cached result")] })
      .mockRejectedValueOnce(
        new YouTubeApiError("unknown", { retryable: false }),
      );
    const screen = await renderScreen(createAdapter(search));

    await submit(screen, "same query");
    await waitFor(() =>
      expect(screen.getByText("Cached result")).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(screen.getByText("Search failed")).toBeTruthy());
    expect(screen.getByText("Cached result")).toBeTruthy();
    await cleanupScreen(screen);
  });

  it("shows a disabled configuration state without creating requests", async () => {
    const screen = await renderScreen(null);

    expect(screen.getByText("Search needs configuration")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
    expect(screen.getByLabelText("Search YouTube")).toBeDisabled();
    await cleanupScreen(screen);
  });
});
