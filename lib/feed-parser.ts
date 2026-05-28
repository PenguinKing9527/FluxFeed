import type { ArticleRecord, FeedLink, FeedRecord } from "@/lib/types";

interface ParsedFeed {
  feed: Omit<FeedRecord, "id" | "groupId" | "refreshInterval" | "lastFetchedAt" | "errorCount" | "createdAt">;
  articles: Array<Omit<ArticleRecord, "id" | "feedId" | "isRead" | "isStarred" | "tags" | "fetchedAt">>;
}

const FEED_TYPES = [
  "application/rss+xml",
  "application/atom+xml",
  "application/feed+json",
  "application/json",
  "text/xml",
  "application/xml",
];

export function isLikelyFeed(contentType: string, body: string) {
  const normalizedType = contentType.toLowerCase();
  if (FEED_TYPES.some((type) => normalizedType.includes(type))) return true;
  const trimmed = body.trimStart();
  return (
    trimmed.startsWith("<?xml") ||
    trimmed.startsWith("<rss") ||
    trimmed.startsWith("<feed") ||
    trimmed.startsWith("{")
  );
}

export function discoverFeedLinks(pageUrl: string, html: string): FeedLink[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(
    doc.querySelectorAll<HTMLLinkElement>(
      'link[rel~="alternate"][type*="rss"], link[rel~="alternate"][type*="atom"], link[rel~="alternate"][type*="feed+json"]',
    ),
  );

  return links
    .map((link) => ({
      url: new URL(link.href, pageUrl).toString(),
      title: link.title || doc.title || new URL(pageUrl).hostname,
      type: link.type || "application/rss+xml",
    }))
    .filter((link, index, all) => all.findIndex((item) => item.url === link.url) === index);
}

export function parseFeed(feedUrl: string, body: string, contentType = ""): ParsedFeed {
  if (contentType.includes("json") || body.trimStart().startsWith("{")) {
    return parseJsonFeed(feedUrl, body);
  }
  return parseXmlFeed(feedUrl, body);
}

function parseJsonFeed(feedUrl: string, body: string): ParsedFeed {
  const json = JSON.parse(body);
  const home = json.home_page_url || new URL(feedUrl).origin;
  return {
    feed: {
      url: feedUrl,
      title: text(json.title) || new URL(feedUrl).hostname,
      description: text(json.description),
      siteUrl: home,
      iconUrl: json.icon || json.favicon || faviconFor(home),
    },
    articles: (json.items || []).map((item: Record<string, unknown>) => ({
      guid: text(item.id) || text(item.url) || crypto.randomUUID(),
      title: text(item.title) || "Untitled",
      url: text(item.url) || home,
      author: authorFromJson(item),
      summary: stripHtml(text(item.summary) || text(item.content_text) || text(item.content_html)).slice(0, 500),
      content: text(item.content_html) || text(item.content_text) || text(item.summary),
      publishedAt: dateToMs(text(item.date_published) || text(item.date_modified)),
    })),
  };
}

function parseXmlFeed(feedUrl: string, body: string): ParsedFeed {
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) throw new Error("Feed XML could not be parsed");

  const rootName = doc.documentElement.localName.toLowerCase();
  return rootName === "feed" ? parseAtom(feedUrl, doc) : parseRss(feedUrl, doc);
}

function parseRss(feedUrl: string, doc: Document): ParsedFeed {
  const channel = doc.querySelector("channel") ?? doc;
  const siteUrl = childText(channel, "link") || new URL(feedUrl).origin;
  const items = Array.from(doc.querySelectorAll("item"));

  return {
    feed: {
      url: feedUrl,
      title: childText(channel, "title") || new URL(feedUrl).hostname,
      description: childText(channel, "description"),
      siteUrl,
      iconUrl: childText(channel, "image url") || faviconFor(siteUrl),
    },
    articles: items.map((item) => {
      const rawUrl = childText(item, "link") || childText(item, "guid");
      const url = safeUrl(rawUrl, siteUrl);
      const content = childText(item, "content\\:encoded") || childText(item, "encoded") || childText(item, "description");
      return {
        guid: childText(item, "guid") || url || crypto.randomUUID(),
        title: childText(item, "title") || "Untitled",
        url: url || siteUrl,
        author: childText(item, "author") || childText(item, "dc\\:creator") || childText(item, "creator"),
        summary: stripHtml(childText(item, "description") || content).slice(0, 500),
        content,
        publishedAt: dateToMs(childText(item, "pubDate") || childText(item, "published") || childText(item, "updated")),
      };
    }),
  };
}

function parseAtom(feedUrl: string, doc: Document): ParsedFeed {
  const feed = doc.documentElement;
  const siteUrl = atomLink(feed, "alternate") || new URL(feedUrl).origin;
  const entries = Array.from(doc.querySelectorAll("entry"));

  return {
    feed: {
      url: feedUrl,
      title: childText(feed, "title") || new URL(feedUrl).hostname,
      description: childText(feed, "subtitle"),
      siteUrl,
      iconUrl: childText(feed, "icon") || faviconFor(siteUrl),
    },
    articles: entries.map((entry) => {
      const url = atomLink(entry, "alternate") || atomLink(entry) || siteUrl;
      const content = childText(entry, "content") || childText(entry, "summary");
      return {
        guid: childText(entry, "id") || url,
        title: childText(entry, "title") || "Untitled",
        url,
        author: childText(entry, "author name"),
        summary: stripHtml(childText(entry, "summary") || content).slice(0, 500),
        content,
        publishedAt: dateToMs(childText(entry, "published") || childText(entry, "updated")),
      };
    }),
  };
}

function atomLink(node: Element, rel?: string) {
  const links = Array.from(node.querySelectorAll("link"));
  const link =
    links.find((item) => (rel ? item.getAttribute("rel") === rel : item.hasAttribute("href"))) ??
    links[0];
  const href = link?.getAttribute("href");
  if (!href) return "";
  return safeUrl(href, "https://example.com") || href;
}

function childText(node: ParentNode, selector: string) {
  return node.querySelector(selector)?.textContent?.trim() ?? "";
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function authorFromJson(item: Record<string, unknown>) {
  const author = item.author;
  if (author && typeof author === "object" && "name" in author) {
    return text((author as { name?: unknown }).name);
  }
  return "";
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function dateToMs(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function safeUrl(value: string, base: string) {
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function faviconFor(siteUrl: string) {
  try {
    const url = new URL(siteUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return "";
  }
}
