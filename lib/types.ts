export type ThemePreference = "light" | "dark" | "system";

export interface FeedLink {
  url: string;
  title: string;
  type: string;
}

export interface FeedRecord {
  id: string;
  url: string;
  title: string;
  description: string;
  siteUrl: string;
  iconUrl: string;
  groupId: string;
  refreshInterval: number;
  lastFetchedAt: number;
  errorCount: number;
  createdAt: number;
}

export interface ArticleRecord {
  id: string;
  feedId: string;
  guid: string;
  title: string;
  url: string;
  author: string;
  summary: string;
  content: string;
  publishedAt: number;
  isRead: boolean;
  isStarred: boolean;
  tags: string[];
  fetchedAt: number;
}

export interface GroupRecord {
  id: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface SettingsRecord {
  id: "global";
  refreshInterval: number;
  maxArticlesPerFeed: number;
  theme: ThemePreference;
  fontSize: "small" | "medium" | "large";
  markReadOnOpen: boolean;
  showUnreadOnly: boolean;
}

export interface FeedWithCounts extends FeedRecord {
  articleCount: number;
  unreadCount: number;
}

export interface ArticleWithFeed extends ArticleRecord {
  feed?: FeedRecord;
}

export interface AppStateSnapshot {
  feeds: FeedWithCounts[];
  articles: ArticleWithFeed[];
  settings: SettingsRecord;
  unreadCount: number;
  detectedFeeds: FeedLink[];
}
