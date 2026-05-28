import { browser } from "wxt/browser";
import type { FeedLink } from "@/lib/types";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_idle",
  main() {
    const sendDetectedFeeds = () => {
      const feeds = detectFeedLinks();
      browser.runtime
        .sendMessage({
          type: "FEEDS_DETECTED",
          pageUrl: location.href,
          feeds,
        })
        .catch(() => {
          // The extension context can be unavailable during reloads.
        });
    };

    sendDetectedFeeds();
  },
});

function detectFeedLinks(): FeedLink[] {
  const links = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel~="alternate"][type*="rss"], link[rel~="alternate"][type*="atom"], link[rel~="alternate"][type*="feed+json"]',
    ),
  );

  return links
    .map((link) => ({
      url: new URL(link.href, location.href).toString(),
      title: link.title || document.title || location.hostname,
      type: link.type || "application/rss+xml",
    }))
    .filter((link, index, all) => all.findIndex((item) => item.url === link.url) === index);
}
