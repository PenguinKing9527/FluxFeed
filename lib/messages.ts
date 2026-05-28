import type { AppStateSnapshot, FeedLink, SettingsRecord } from "@/lib/types";

export type RuntimeRequest =
  | { type: "GET_STATE"; limit?: number; query?: string; feedId?: string; starredOnly?: boolean }
  | { type: "ADD_FEED"; url: string }
  | { type: "REFRESH_FEED"; feedId: string }
  | { type: "REFRESH_ALL" }
  | { type: "DELETE_FEED"; feedId: string }
  | { type: "MARK_ALL_READ"; feedId?: string }
  | { type: "MARK_ARTICLE_READ"; articleId: string; isRead?: boolean }
  | { type: "TOGGLE_STAR"; articleId: string }
  | { type: "UPDATE_SETTINGS"; settings: Partial<SettingsRecord> }
  | { type: "FEEDS_DETECTED"; tabId?: number; pageUrl: string; feeds: FeedLink[] }
  | { type: "GET_DETECTED_FEEDS" }
  | { type: "OPEN_OPTIONS" };

export type RuntimeResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type StateResponse = RuntimeResponse<AppStateSnapshot>;
