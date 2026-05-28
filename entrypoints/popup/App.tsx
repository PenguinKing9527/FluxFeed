import { useEffect, useMemo, useState } from "react";
import { browser } from "wxt/browser";
import {
  CheckCheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PlusCircleIcon,
  RssIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { RuntimeRequest, RuntimeResponse } from "@/lib/messages";
import type { AppStateSnapshot, FeedLink } from "@/lib/types";

export function App() {
  const [state, setState] = useState<AppStateSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const detectedFeed = useMemo(() => state?.detectedFeeds[0], [state]);

  useEffect(() => {
    void loadState();
  }, []);

  useEffect(() => {
    if (state?.settings.theme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle(
        "dark",
        state.settings.theme === "dark" || (state.settings.theme === "system" && prefersDark),
      );
    }
  }, [state?.settings.theme]);

  async function loadState() {
    const next = await send<AppStateSnapshot>({ type: "GET_STATE", limit: 8 });
    setState(next);
  }

  async function subscribe(feed: FeedLink) {
    setBusy(true);
    setError("");
    try {
      await send({ type: "ADD_FEED", url: feed.url });
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Subscribe failed");
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await send({ type: "MARK_ALL_READ" });
      await loadState();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[600px] w-[380px] flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <RssIcon />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-none">FluxFeed</h1>
            <p className="text-xs text-muted-foreground">{state?.unreadCount ?? 0} unread</p>
          </div>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => void send({ type: "OPEN_OPTIONS" })}>
          <ExternalLinkIcon data-icon="inline-start" />
        </Button>
      </header>

      {detectedFeed ? (
        <section className="border-b bg-muted/40 p-3">
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Feed detected</p>
                <p className="truncate text-xs text-muted-foreground">{detectedFeed.title}</p>
              </div>
              <Badge variant="secondary">RSS</Badge>
            </div>
            <Button disabled={busy} onClick={() => void subscribe(detectedFeed)}>
              {busy ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusCircleIcon data-icon="inline-start" />}
              Subscribe to this page
            </Button>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
        </section>
      ) : null}

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-2 flex items-end justify-between gap-3">
          <h2 className="text-sm font-semibold">Recent Articles</h2>
          <span className="text-xs text-muted-foreground">{state?.articles.length ?? 0} loaded</span>
        </div>

        {state && state.articles.length > 0 ? (
          <div className="flex flex-col">
            {state.articles.map((article) => (
              <button
                key={article.id}
                className="group flex w-full gap-3 rounded-lg py-3 text-left transition-colors hover:bg-muted/60"
                onClick={() => {
                  void send({ type: "MARK_ARTICLE_READ", articleId: article.id });
                  window.open(article.url, "_blank", "noopener,noreferrer");
                }}
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary data-[read=true]:bg-transparent" data-read={article.isRead} />
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{article.feed?.title ?? "Feed"}</span>
                    <span>{relativeTime(article.publishedAt)}</span>
                  </span>
                  <span className="line-clamp-2 text-sm font-medium leading-snug">{article.title}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Empty className="min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RssIcon />
              </EmptyMedia>
              <EmptyTitle>No articles yet</EmptyTitle>
              <EmptyDescription>Subscribe to a feed or open the reader to add one manually.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>

      <footer className="flex h-14 shrink-0 items-center justify-between border-t bg-muted/30 px-3">
        <Button variant="ghost" size="sm" onClick={() => void send({ type: "OPEN_OPTIONS" })}>
          <SettingsIcon data-icon="inline-start" />
          Settings
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => void markAllRead()}>
          <CheckCheckIcon data-icon="inline-start" />
          Mark read
        </Button>
      </footer>
    </div>
  );
}

async function send<T = unknown>(request: RuntimeRequest): Promise<T> {
  const response = (await browser.runtime.sendMessage(request)) as RuntimeResponse<T>;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

function relativeTime(timestamp: number) {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
