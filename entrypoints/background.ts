import { browser } from "wxt/browser";
import { db, deleteFeed, enforceArticleLimit, getFeedsWithCounts, getSettings, markAllRead, updateSettings } from "@/lib/db";
import { discoverFeedLinks, isLikelyFeed, parseFeed } from "@/lib/feed-parser";
import type { RuntimeRequest, RuntimeResponse } from "@/lib/messages";
import type { ArticleRecord, FeedLink, FeedRecord } from "@/lib/types";

const detectedFeedsByTab = new Map<number, FeedLink[]>();
const REFRESH_ALARM = "fluxfeed-refresh";

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await getSettings();
    await scheduleRefresh();
    await updateBadge();
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === REFRESH_ALARM) {
      refreshAllFeeds().catch(console.error);
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    detectedFeedsByTab.delete(tabId);
  });

  browser.runtime.onMessage.addListener((request: RuntimeRequest, sender) => {
    return handleMessage(request, sender).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown FluxFeed error";
      return { ok: false, error: message } satisfies RuntimeResponse;
    });
  });
});

async function handleMessage(
  request: RuntimeRequest,
  sender: Browser.runtime.MessageSender,
): Promise<RuntimeResponse> {
  switch (request.type) {
    case "GET_STATE":
      return ok(await getState(request));
    case "ADD_FEED":
      return ok(await addFeedFromUrl(request.url));
    case "REFRESH_FEED":
      return ok(await refreshFeed(request.feedId));
    case "REFRESH_ALL":
      return ok(await refreshAllFeeds());
    case "DELETE_FEED":
      await deleteFeed(request.feedId);
      await updateBadge();
      return ok(true);
    case "MARK_ALL_READ":
      await markAllRead(request.feedId);
      await updateBadge();
      return ok(true);
    case "MARK_ARTICLE_READ":
      await db.articles.update(request.articleId, { isRead: request.isRead ?? true });
      await updateBadge();
      return ok(true);
    case "TOGGLE_STAR": {
      const article = await db.articles.get(request.articleId);
      if (!article) throw new Error("Article not found");
      await db.articles.update(article.id, { isStarred: !article.isStarred });
      return ok(!article.isStarred);
    }
    case "UPDATE_SETTINGS": {
      const settings = await updateSettings(request.settings);
      await scheduleRefresh();
      return ok(settings);
    }
    case "FEEDS_DETECTED": {
      const tabId = request.tabId ?? sender.tab?.id;
      if (typeof tabId === "number") {
        detectedFeedsByTab.set(tabId, request.feeds);
      }
      return ok(true);
    }
    case "GET_DETECTED_FEEDS":
      return ok(await getDetectedFeedsForActiveTab());
    case "OPEN_OPTIONS":
      await browser.runtime.openOptionsPage();
      return ok(true);
    default:
      return { ok: false, error: "Unsupported FluxFeed request" };
  }
}

async function getState(options: Extract<RuntimeRequest, { type: "GET_STATE" }>) {
  const [feeds, settings, detectedFeeds] = await Promise.all([
    getFeedsWithCounts(),
    getSettings(),
    getDetectedFeedsForActiveTab(),
  ]);
  const articleRows = options.feedId
    ? await db.articles
        .where("feedId")
        .equals(options.feedId)
        .reverse()
        .sortBy("publishedAt")
    : await db.articles
        .orderBy("publishedAt")
        .reverse()
        .limit(options.limit ?? 80)
        .toArray();

  if (options.starredOnly) {
    articleRows.splice(0, articleRows.length, ...articleRows.filter((article) => article.isStarred));
  }
  if (options.query) {
    const query = options.query.toLowerCase();
    articleRows.splice(
      0,
      articleRows.length,
      ...articleRows.filter((article) =>
        [article.title, article.summary, article.author].some((value) =>
          value.toLowerCase().includes(query),
        ),
      ),
    );
  }
  if (settings.showUnreadOnly) {
    articleRows.splice(0, articleRows.length, ...articleRows.filter((article) => !article.isRead));
  }

  const feedMap = new Map(feeds.map((feed) => [feed.id, feed]));
  const unreadCount = await db.articles.filter((article) => !article.isRead).count();

  return {
    feeds,
    articles: articleRows.map((article) => ({
      ...article,
      feed: feedMap.get(article.feedId),
    })),
    settings,
    unreadCount,
    detectedFeeds,
  };
}

async function addFeedFromUrl(inputUrl: string) {
  const url = normalizeHttpUrl(inputUrl);
  const existing = await db.feeds.where("url").equals(url).first();
  if (existing) {
    await refreshFeed(existing.id);
    return existing;
  }

  const resolved = await resolveFeedUrl(url);
  const duplicate = await db.feeds.where("url").equals(resolved.feedUrl).first();
  if (duplicate) {
    await refreshFeed(duplicate.id);
    return duplicate;
  }

  const parsed = parseFeed(resolved.feedUrl, resolved.body, resolved.contentType);
  const now = Date.now();
  const feed: FeedRecord = {
    ...parsed.feed,
    id: crypto.randomUUID(),
    groupId: "",
    refreshInterval: 0,
    lastFetchedAt: now,
    errorCount: 0,
    createdAt: now,
  };
  const articles = materializeArticles(feed.id, parsed.articles);

  await db.transaction("rw", db.feeds, db.articles, async () => {
    await db.feeds.add(feed);
    await db.articles.bulkPut(articles);
  });
  await enforceArticleLimit(feed.id);
  await updateBadge();
  return feed;
}

async function refreshFeed(feedId: string) {
  const feed = await db.feeds.get(feedId);
  if (!feed) throw new Error("Feed not found");

  try {
    const response = await fetch(feed.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Fetch failed with ${response.status}`);
    const body = await response.text();
    const parsed = parseFeed(feed.url, body, response.headers.get("content-type") ?? "");
    const articles = materializeArticles(feed.id, parsed.articles);

    await db.transaction("rw", db.feeds, db.articles, async () => {
      await db.feeds.update(feed.id, {
        title: parsed.feed.title || feed.title,
        description: parsed.feed.description,
        siteUrl: parsed.feed.siteUrl || feed.siteUrl,
        iconUrl: parsed.feed.iconUrl || feed.iconUrl,
        lastFetchedAt: Date.now(),
        errorCount: 0,
      });
      await putNewArticles(articles);
    });
    await enforceArticleLimit(feed.id);
  } catch (error) {
    await db.feeds.update(feed.id, { errorCount: feed.errorCount + 1 });
    throw error;
  } finally {
    await updateBadge();
  }

  return db.feeds.get(feed.id);
}

async function refreshAllFeeds() {
  const feeds = await db.feeds.toArray();
  const results = await Promise.allSettled(feeds.map((feed) => refreshFeed(feed.id)));
  await updateBadge();
  return {
    total: feeds.length,
    failed: results.filter((result) => result.status === "rejected").length,
  };
}

async function resolveFeedUrl(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to fetch ${url}`);
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (isLikelyFeed(contentType, body)) {
    return { feedUrl: response.url, body, contentType };
  }

  const links = discoverFeedLinks(response.url, body);
  if (links.length === 0) {
    throw new Error("No RSS, Atom, or JSON Feed link was found on this page");
  }

  const feedResponse = await fetch(links[0].url, { cache: "no-store" });
  if (!feedResponse.ok) throw new Error(`Unable to fetch ${links[0].url}`);
  return {
    feedUrl: feedResponse.url,
    body: await feedResponse.text(),
    contentType: feedResponse.headers.get("content-type") ?? links[0].type,
  };
}

async function putNewArticles(articles: ArticleRecord[]) {
  for (const article of articles) {
    const exists = await db.articles
      .where("[feedId+guid]")
      .equals([article.feedId, article.guid])
      .first();
    if (!exists) {
      await db.articles.add(article);
    }
  }
}

function materializeArticles(
  feedId: string,
  articles: Array<Omit<ArticleRecord, "id" | "feedId" | "isRead" | "isStarred" | "tags" | "fetchedAt">>,
): ArticleRecord[] {
  const fetchedAt = Date.now();
  return articles.map((article) => ({
    ...article,
    id: crypto.randomUUID(),
    feedId,
    isRead: false,
    isStarred: false,
    tags: [],
    fetchedAt,
  }));
}

async function getDetectedFeedsForActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return [];
  return detectedFeedsByTab.get(tab.id) ?? [];
}

async function updateBadge() {
  const unread = await db.articles.filter((article) => !article.isRead).count();
  await browser.action.setBadgeText({ text: unread > 0 ? String(Math.min(unread, 999)) : "" });
  await browser.action.setBadgeBackgroundColor({ color: "#d97706" });
}

async function scheduleRefresh() {
  const settings = await getSettings();
  await browser.alarms.clear(REFRESH_ALARM);
  await browser.alarms.create(REFRESH_ALARM, {
    periodInMinutes: Math.max(settings.refreshInterval, 5),
  });
}

function normalizeHttpUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Feed URL must use http or https");
  }
  return url.toString();
}

function ok<T>(data: T): RuntimeResponse<T> {
  return { ok: true, data };
}
