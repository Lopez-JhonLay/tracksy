import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { SearchLocale } from "@/config";
import {
  Surface,
  ThemedButton,
  ThemedScreen,
  ThemedText,
  useTheme,
} from "@/theme";

import type { YouTubeApiAdapter, YouTubeApiError } from "../api";
import type { SearchResult } from "../contracts";
import { useDiscoverySearch } from "../query-state";
import { validateSearchQuery } from "../query";

type MaterialIconName = ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type DiscoverSearchScreenProps = {
  adapter: YouTubeApiAdapter | null;
  locale: SearchLocale;
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
        Find a YouTube video and send its link to the converter.
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
          padded={false}
          style={[
            styles.resultRow,
            { minHeight: theme.layout.resultThumbnailHeight },
          ]}
        >
          <View
            style={[
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.sm,
                height: theme.layout.resultThumbnailHeight,
                width: theme.layout.resultThumbnailWidth,
              },
            ]}
          />
          <View
            style={[
              styles.skeletonText,
              { gap: theme.spacing.xs, padding: theme.spacing.sm },
            ]}
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
          </View>
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

function ResultRow({ item }: { item: SearchResult }) {
  const theme = useTheme();

  return (
    <Surface
      accessibilityLabel={`Video: ${item.title}`}
      padded={false}
      style={[
        styles.resultRow,
        { minHeight: theme.layout.resultThumbnailHeight },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={`Thumbnail for ${item.title}`}
        source={{ uri: item.thumbnailUrl }}
        style={[
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderRadius: theme.radius.sm,
            height: theme.layout.resultThumbnailHeight,
            width: theme.layout.resultThumbnailWidth,
          },
        ]}
      />
      <View style={[styles.resultText, { padding: theme.spacing.sm }]}>
        <ThemedText numberOfLines={2} variant="label">
          {item.title}
        </ThemedText>
      </View>
    </Surface>
  );
}

function renderResultRow({ item }: ListRenderItemInfo<SearchResult>) {
  return <ResultRow item={item} />;
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
  locale,
}: {
  adapter: YouTubeApiAdapter;
  locale: SearchLocale;
}) {
  const theme = useTheme();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
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
  const isInitialLoading =
    submittedQuery.length > 0 && search.isPending && !search.error;
  const isEmpty =
    search.isSuccess && submittedQuery.length > 0 && items.length === 0;

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
          ListHeaderComponent={
            <View style={{ gap: theme.layout.sectionGap }}>
              <ScreenHeader />
              <SearchForm
                error={validationError}
                onChangeText={setDraftQuery}
                onSubmit={submitSearch}
                value={draftQuery}
              />
              {errorStatus ? (
                <StatusCard
                  {...errorStatus}
                  onRetry={
                    retryableError ? () => void search.refetch() : undefined
                  }
                />
              ) : search.isFetching && items.length > 0 ? (
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
  locale,
}: DiscoverSearchScreenProps) {
  return adapter ? (
    <ConfiguredDiscoverScreen adapter={adapter} locale={locale} />
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
  skeletonText: {
    flex: 1,
  },
  statusHeading: {
    alignItems: "center",
    flexDirection: "row",
  },
});
