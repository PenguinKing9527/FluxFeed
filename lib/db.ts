import Dexie, { type Table } from "dexie";
import type {
  ArticleRecord,
  FeedRecord,
  FeedWithCounts,
  GroupRecord,
  SettingsRecord,
} from "@/lib/types";

const DEFAULT_SETTINGS: SettingsRecord = {
  id: "global",
  refreshInterval: 60,
  maxArticlesPerFeed: 200,
  theme: "system",
  fontSize: "medium",
  markReadOnOpen: true,
  showUnreadOnly: false,
};

export class FluxFeedDatabase extends Dexie {
  feeds!: Table<FeedRecord, string>;
  articles!: Table<ArticleRecord, string>;
  groups!: Table<GroupRecord, string>;
  settings!: Table<SettingsRecord, string>;

  constructor() {
    super("fluxfeed-db");
    this.version(1).stores({
      feeds: "id, &url, groupId, lastFetchedAt, createdAt",
      articles:
        "id, feedId, guid, [feedId+guid], publishedAt, isRead, isStarred, *tags",
      groups: "id, order, createdAt",
      settings: "id",
    });
  }
}

export const db = new FluxFeedDatabase();

export async function getSettings() {
  const existing = await db.settings.get("global");
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<SettingsRecord>) {
  const next = { ...(await getSettings()), ...patch, id: "global" as const };
  await db.settings.put(next);
  return next;
}

export async function getFeedsWithCounts(): Promise<FeedWithCounts[]> {
  const feeds = await db.feeds.orderBy("createdAt").toArray();
  const rows = await Promise.all(
    feeds.map(async (feed) => {
      const [articleCount, unreadCount] = await Promise.all([
        db.articles.where("feedId").equals(feed.id).count(),
        db.articles
          .where("feedId")
          .equals(feed.id)
          .and((article) => !article.isRead)
          .count(),
      ]);
      return { ...feed, articleCount, unreadCount };
    }),
  );

  return rows.sort((a, b) => b.unreadCount - a.unreadCount || a.title.localeCompare(b.title));
}

export async function deleteFeed(feedId: string) {
  await db.transaction("rw", db.feeds, db.articles, async () => {
    await db.feeds.delete(feedId);
    await db.articles.where("feedId").equals(feedId).delete();
  });
}

export async function markAllRead(feedId?: string) {
  const collection = feedId
    ? db.articles.where("feedId").equals(feedId)
    : db.articles.toCollection();
  await collection.modify({ isRead: true });
}

export async function enforceArticleLimit(feedId: string) {
  const settings = await getSettings();
  const articles = await db.articles
    .where("feedId")
    .equals(feedId)
    .reverse()
    .sortBy("publishedAt");
  const removable = articles.slice(settings.maxArticlesPerFeed);
  const removableIds = removable
    .filter((article) => !article.isStarred)
    .map((article) => article.id);
  if (removableIds.length > 0) {
    await db.articles.bulkDelete(removableIds);
  }
}
