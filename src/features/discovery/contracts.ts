export type SearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds?: number;
  canonicalUrl: string;
};

export type SearchPage = {
  items: SearchResult[];
  nextPageToken?: string;
};
