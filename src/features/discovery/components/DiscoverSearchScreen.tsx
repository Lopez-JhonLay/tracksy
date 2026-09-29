import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCallback, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  ToastAndroid,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SearchLocale } from "@/config";
import type { UseVideoLink } from "@/features/converter";
import {
  Surface,
  ThemedButton,
  ThemedScreen,
  ThemedText,
  useTheme,
} from "@/theme";

import type { YouTubeApiAdapter, YouTubeApiError } from "../api";
import type { SearchResult } from "../contracts";
import { formatDuration } from "../duration";
import {
  openYouTubeVideo,
  type OpenYouTubeVideo,
} from "../external-linking";
import { useDiscoverySearch } from "../query-state";
import { validateSearchQuery } from "../query";

type MaterialIconName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type DiscoverSearchScreenProps = {
  adapter: YouTubeApiAdapter | null;
  initialQuery?: string;
  locale: SearchLocale;
  openVideo?: OpenYouTubeVideo;
  useLink?: UseVideoLink;
};

type SearchFormProps = {
  disabled?: boolean;
  error?: string;
  onChangeText(value: string): void;
  onSubmit(): void;
  value: string;
};

function SearchForm({
  disabled = false,
  error,
  onChangeText,
  onSubmit,
  value,
}: SearchFormProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={[styles.searchRow, { gap: theme.spacing.xs }]}>
        <View
          style={[
            styles.searchField,
            {
              backgroundColor: disabled
                ? theme.colors.surfaceMuted
                : theme.colors.surface,
              borderColor: focused
                ? theme.colors.focus
                : error
                  ? theme.colors.danger
                  : theme.colors.border,
              borderRadius: theme.radius.md,
              minHeight: theme.layout.searchFieldHeight,
              paddingHorizontal: theme.spacing.sm,
            },
            focused && styles.focusedField,
          ]}
        >
          <MaterialCommunityIcons
            accessibilityElementsHidden
            color={theme.colors.textMuted}
            name="magnify"
            size={theme.iconSize.lg}
          />
          <TextInput
            accessibilityLabel="Search YouTube"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!disabled}
            onBlur={() => setFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onSubmitEditing={onSubmit}
            placeholder="Search videos"
            placeholderTextColor={theme.colors.textMuted}
            returnKeyType="search"
            style={[
              styles.input,
              theme.typography.body,
              { color: theme.colors.text },
            ]}
            value={value}
          />
        </View>
        <ThemedButton
          disabled={disabled}
          label="Search"
          onPress={onSubmit}
          style={styles.searchButton}
        />
      </View>
      {error ? (
        <ThemedText accessibilityLiveRegion="polite" tone="danger" variant="bodySmall">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

function ScreenHeader() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <ThemedText accessibilityRole="header" variant="title">
        Tracksy
      </ThemedText>
      <ThemedText tone="muted">
        Find a YouTube video, then copy and open its link in the converter.
      </ThemedText>
    </View>
  );
}

function SearchSkeleton() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Loading search results"
      accessibilityLiveRegion="polite"
      style={{ gap: theme.spacing.sm }}
    >
      {[0, 1, 2].map((item) => (
        <Surface
          key={item}
          style={{ gap: theme.spacing.xs }}
        >
          <View
            style={[
              styles.skeletonLine,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.sm,
                height: theme.spacing.md,
              },
            ]}
          />
          <View
            style={[
              styles.skeletonLineShort,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.sm,
                height: theme.spacing.sm,
              },
            ]}
          />
        </Surface>
      ))}
    </View>
  );
}

type StatusCardProps = {
  body: string;
  icon: MaterialIconName;
  onRetry?: () => void;
  title: string;
  tone?: "danger" | "info" | "warning";
};

function StatusCard({
  body,
  icon,
  onRetry,
  title,
  tone = "info",
}: StatusCardProps) {
  const theme = useTheme();
  const color = theme.colors[tone];

  return (
    <Surface
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={{ gap: theme.spacing.sm }}
    >
      <View style={[styles.statusHeading, { gap: theme.spacing.xs }]}>
        <MaterialCommunityIcons color={color} name={icon} size={theme.iconSize.lg} />
        <ThemedText tone={tone} variant="label">
          {title}
        </ThemedText>
      </View>
      <ThemedText tone="muted" variant="bodySmall">
        {body}
      </ThemedText>
      {onRetry ? (
        <ThemedButton label="Retry" onPress={onRetry} variant="secondary" />
      ) : null}
    </Surface>
  );
}

function ResultRow({
  item,
  onOpen,
  onUseLink,
}: {
  item: SearchResult;
  onOpen: OpenYouTubeVideo;
  onUseLink?: UseVideoLink;
}) {
  const theme = useTheme();
  const duration = formatDuration(item.durationSeconds);
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleOpen() {
    if (opening) {
      return;
    }

    setOpening(true);
    const result = await onOpen(item.videoId);
    setOpening(false);

    if (result.status !== "opened") {
      Alert.alert(
        "Unable to open YouTube",
        "No YouTube app or browser could open this video.",
      );
    }
  }

  async function handleUseLink() {
    if (!onUseLink || sending) {
      return;
    }

    setSending(true);

    try {
      const result = await onUseLink(item);
      if (result.clipboardStatus === "unavailable") {
        ToastAndroid.show(
          "Converter opened, but the link could not be copied.",
          ToastAndroid.SHORT,
        );
      }
      if (result.converterOpenStatus === "unavailable") {
        Alert.alert(
          "Unable to open converter",
          "The link may be in your clipboard. Try Copy & Open again.",
        );
      }
    } catch {
      Alert.alert(
        "Unable to use link",
        "Tracksy could not copy and open this link.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Surface
      accessibilityLabel={`Video: ${item.title}`}
      padded={false}
      style={[
        styles.resultRow,
      ]}
    >
      <View
        style={[
          styles.resultText,
          { gap: theme.spacing.xxs, padding: theme.spacing.sm },
        ]}
      >
        <ThemedText numberOfLines={2} variant="label">
          {item.title}
        </ThemedText>
        <ThemedText numberOfLines={1} tone="muted" variant="caption">
          {duration
            ? `${item.channelTitle} • ${duration}`
            : item.channelTitle}
        </ThemedText>
        <View
          style={[
            styles.resultActions,
            { gap: theme.spacing.xs, marginTop: theme.spacing.sm },
          ]}
        >
          {onUseLink ? (
            <ThemedButton
              accessibilityLabel={
                sending
                  ? `Opening converter for ${item.title}`
                  : `Copy and open converter for ${item.title}`
              }
              label={sending ? "Opening" : "Copy & Open"}
              leadingIcon={
                <MaterialCommunityIcons
                  accessibilityElementsHidden
                  color={theme.colors.onPrimary}
                  name="link-variant"
                  size={theme.iconSize.sm}
                />
              }
              loading={sending}
              onPress={() => void handleUseLink()}
              style={styles.resultAction}
            />
          ) : null}
          <ThemedButton
            accessibilityLabel={
              opening
                ? `Opening ${item.title} in YouTube`
                : `Open ${item.title} in YouTube`
            }
            label={opening ? "Opening" : "Open in YouTube"}
            leadingIcon={
              <MaterialCommunityIcons
                accessibilityElementsHidden
                color={theme.colors.primary}
                name="open-in-new"
                size={theme.iconSize.sm}
              />
            }
            loading={opening}
            onPress={() => void handleOpen()}
            style={styles.resultAction}
            variant="secondary"
          />
        </View>
      </View>
    </Surface>
  );
}

type LoadMoreFooterProps = {
  hasNextPage: boolean;
  loading: boolean;
  onPress(): void;
};

function LoadMoreFooter({
  hasNextPage,
  loading,
  onPress,
}: LoadMoreFooterProps) {
  const theme = useTheme();

  if (!hasNextPage) {
    return null;
  }

  return (
    <View style={{ paddingTop: theme.spacing.sm }}>
      <ThemedButton
        accessibilityLabel={loading ? "Loading more results" : "Load More"}
        label={loading ? "Loading more" : "Load More"}
        loading={loading}
        onPress={onPress}
        variant="secondary"
      />
    </View>
  );
}

function getErrorStatus(error: YouTubeApiError): StatusCardProps | null {
  switch (error.code) {
    case "cancelled":
      return null;
    case "offline":
      return {
        title: "You're offline",
        body: "Check your connection, then try the search again.",
        icon: "wifi-off",
        tone: "warning",
      };
    case "quota_exceeded":
      return {
        title: "Search limit reached",
        body: "YouTube search is unavailable until the quota resets.",
        icon: "speedometer-slow",
        tone: "warning",
      };
    case "invalid_key":
      return {
        title: "Search needs configuration",
        body: "The YouTube API configuration is not valid for this app build.",
        icon: "key-alert-outline",
        tone: "danger",
      };
    case "service_unavailable":
      return {
        title: "YouTube is unavailable",
        body: "The service could not complete this search. Try again.",
        icon: "cloud-alert-outline",
        tone: "warning",
      };
    case "unknown":
      return {
        title: "Search failed",
        body: "Something went wrong while searching. Try again.",
        icon: "alert-circle-outline",
        tone: "danger",
      };
  }
}

function UnconfiguredDiscoverScreen() {
  const theme = useTheme();

  return (
    <ThemedScreen>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View
          style={[
            styles.content,
            {
              gap: theme.layout.sectionGap,
              maxWidth: theme.layout.maxContentWidth,
              padding: theme.layout.screenPadding,
            },
          ]}
        >
          <ScreenHeader />
          <SearchForm
            disabled
            onChangeText={() => undefined}
            onSubmit={() => undefined}
            value=""
          />
          <StatusCard
            body="Add the required public YouTube configuration and restart this build."
            icon="key-alert-outline"
            title="Search needs configuration"
            tone="danger"
          />
        </View>
      </SafeAreaView>
    </ThemedScreen>
  );
}

function ConfiguredDiscoverScreen({
  adapter,
  initialQuery = "",
  locale,
  openVideo,
  useLink,
}: {
  adapter: YouTubeApiAdapter;
  initialQuery?: string;
  locale: SearchLocale;
  openVideo: OpenYouTubeVideo;
  useLink?: UseVideoLink;
}) {
  const theme = useTheme();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [showingDiscoveryFeed, setShowingDiscoveryFeed] = useState(
    initialQuery.trim().length > 0,
  );
  const [validationError, setValidationError] = useState<string>();
  const search = useDiscoverySearch({
    adapter,
    enabled: submittedQuery.length > 0,
    locale,
    query: submittedQuery,
  });
  const items = search.data?.items ?? [];

  function submitSearch() {
    const validation = validateSearchQuery(draftQuery);

    if (validation.status === "invalid") {
      setValidationError("Enter at least two characters to search.");
      return;
    }

    setValidationError(undefined);
    setShowingDiscoveryFeed(false);
    if (validation.query === submittedQuery) {
      void search.refetch();
      return;
    }

    setSubmittedQuery(validation.query);
  }

  const errorStatus = search.error ? getErrorStatus(search.error) : null;
  const retryableError =
    search.error?.code === "offline" ||
    search.error?.code === "service_unavailable" ||
    search.error?.code === "unknown";
  const retrySearch = search.isFetchNextPageError
    ? search.fetchNextPage
    : search.refetch;
  const isInitialLoading =
    submittedQuery.length > 0 && search.isPending && !search.error;
  const isEmpty =
    search.isSuccess && submittedQuery.length > 0 && items.length === 0;
  const renderResultRow = useCallback(
    ({ item }: ListRenderItemInfo<SearchResult>) => (
      <ResultRow item={item} onOpen={openVideo} onUseLink={useLink} />
    ),
    [openVideo, useLink],
  );

  return (
    <ThemedScreen>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <FlatList
          contentContainerStyle={[
            styles.listContent,
            {
              gap: theme.spacing.sm,
              maxWidth: theme.layout.maxContentWidth,
              padding: theme.layout.screenPadding,
              paddingBottom: theme.spacing.xxl,
            },
          ]}
          data={items}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.videoId}
          ListEmptyComponent={
            isInitialLoading ? (
              <SearchSkeleton />
            ) : isEmpty ? (
              <StatusCard
                body="Try a different title, artist, or keyword."
                icon="magnify-close"
                title="No videos found"
              />
            ) : null
          }
          ListFooterComponent={
            <LoadMoreFooter
              hasNextPage={search.hasNextPage}
              loading={search.isFetchingNextPage}
              onPress={() => void search.fetchNextPage()}
            />
          }
          ListHeaderComponent={
            <View style={{ gap: theme.layout.sectionGap }}>
              <ScreenHeader />
              <SearchForm
                error={validationError}
                onChangeText={setDraftQuery}
                onSubmit={submitSearch}
                value={draftQuery}
              />
              {showingDiscoveryFeed && !errorStatus ? (
                <View
                  accessibilityLabel="Music for you"
                  style={[styles.statusHeading, { gap: theme.spacing.xs }]}
                >
                  <MaterialCommunityIcons
                    accessibilityElementsHidden
                    color={theme.colors.accent}
                    name="music-note"
                    size={theme.iconSize.lg}
                  />
                  <ThemedText variant="heading">Music for you</ThemedText>
                </View>
              ) : null}
              {errorStatus ? (
                <StatusCard
                  {...errorStatus}
                  onRetry={
                    retryableError ? () => void retrySearch() : undefined
                  }
                />
              ) : search.isFetching &&
                !search.isFetchingNextPage &&
                items.length > 0 ? (
                <View
                  accessibilityLabel="Refreshing search results"
                  accessibilityLiveRegion="polite"
                  style={[styles.refreshing, { gap: theme.spacing.xs }]}
                >
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                  <ThemedText tone="muted" variant="bodySmall">
                    Refreshing results…
                  </ThemedText>
                </View>
              ) : null}
            </View>
          }
          renderItem={renderResultRow}
          style={styles.list}
        />
      </SafeAreaView>
    </ThemedScreen>
  );
}

export function DiscoverSearchScreen({
  adapter,
  initialQuery,
  locale,
  openVideo = openYouTubeVideo,
  useLink,
}: DiscoverSearchScreenProps) {
  return adapter ? (
    <ConfiguredDiscoverScreen
      adapter={adapter}
      initialQuery={initialQuery}
      locale={locale}
      openVideo={openVideo}
      useLink={useLink}
    />
  ) : (
    <UnconfiguredDiscoverScreen />
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "center",
    flex: 1,
    width: "100%",
  },
  focusedField: {
    borderWidth: 2,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    alignSelf: "center",
    flexGrow: 1,
    width: "100%",
  },
  refreshing: {
    alignItems: "center",
    flexDirection: "row",
  },
  resultRow: {
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
  },
  resultAction: {
    flex: 1,
  },
  resultActions: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  resultText: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  searchButton: {
    alignSelf: "stretch",
  },
  searchField: {
    alignItems: "center",
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
  },
  searchRow: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  skeletonLine: {
    width: "90%",
  },
  skeletonLineShort: {
    width: "55%",
  },
  statusHeading: {
    alignItems: "center",
    flexDirection: "row",
  },
});
