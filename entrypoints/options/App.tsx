import { useEffect, useMemo, useState } from "react";
import { browser } from "wxt/browser";
import DOMPurify from "dompurify";
import {
  CheckCheckIcon,
  ExternalLinkIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCcwIcon,
  RssIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { RuntimeRequest, RuntimeResponse } from "@/lib/messages";
import type { AppStateSnapshot, ArticleWithFeed, SettingsRecord } from "@/lib/types";

type ViewMode = "reader" | "feeds" | "settings";

export function App() {
  const [state, setState] = useState<AppStateSnapshot | null>(null);
  const [selectedFeedId, setSelectedFeedId] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("reader");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void loadState();
  }, [selectedFeedId, query]);

  useEffect(() => {
    if (state?.settings.theme) {
      applyTheme(state.settings.theme);
    }
  }, [state?.settings.theme]);

  const selectedArticle = useMemo(
    () => state?.articles.find((article) => article.id === selectedArticleId) ?? state?.articles[0],
    [selectedArticleId, state?.articles],
  );

  useEffect(() => {
    if (!selectedArticleId && selectedArticle?.id) {
      setSelectedArticleId(selectedArticle.id);
    }
  }, [selectedArticle?.id, selectedArticleId]);

  async function loadState() {
    const next = await send<AppStateSnapshot>({
      type: "GET_STATE",
      limit: 120,
      feedId: selectedFeedId || undefined,
      query: query || undefined,
    });
    setState(next);
  }

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    setError("");
    try {
      await action();
      await loadState();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Request failed");
    } finally {
      setBusy("");
    }
  }

  async function addFeed() {
    const target = url.trim() || state?.detectedFeeds[0]?.url || "";
    if (!target) return;
    await run("add", async () => {
      await send({ type: "ADD_FEED", url: target });
      setUrl("");
    });
  }

  async function updateSettings(settings: Partial<SettingsRecord>) {
    const next = await send<SettingsRecord>({ type: "UPDATE_SETTINGS", settings });
    setState((current) => (current ? { ...current, settings: next } : current));
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen min-h-[720px] bg-background text-foreground">
        <aside className="flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
          <div className="flex h-16 items-center gap-3 border-b px-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <RssIcon />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">FluxFeed</h1>
              <p className="text-xs text-muted-foreground">Local RSS reader</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            <NavButton active={view === "reader"} onClick={() => setView("reader")}>Reader</NavButton>
            <NavButton active={view === "feeds"} onClick={() => setView("feeds")}>Subscriptions</NavButton>
            <NavButton active={view === "settings"} onClick={() => setView("settings")}>Settings</NavButton>
          </nav>

          <Separator />

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <button
              className="mb-2 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent"
              onClick={() => setSelectedFeedId("")}
            >
              <span>All feeds</span>
              <Badge variant="secondary">{state?.unreadCount ?? 0}</Badge>
            </button>
            <div className="flex flex-col gap-1">
              {state?.feeds.map((feed) => (
                <button
                  key={feed.id}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent"
                  data-active={selectedFeedId === feed.id}
                  onClick={() => {
                    setSelectedFeedId(feed.id);
                    setView("reader");
                  }}
                >
                  <img alt="" className="size-4 rounded-sm" src={feed.iconUrl || "/icon/16.png"} />
                  <span className="min-w-0 flex-1 truncate">{feed.title}</span>
                  {feed.unreadCount > 0 ? <Badge variant="secondary">{feed.unreadCount}</Badge> : null}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="grid min-w-0 flex-1 grid-cols-[360px_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col border-r">
            <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <div className="relative min-w-0 flex-1">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search articles"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon-sm" variant="outline" disabled={busy === "refresh"} onClick={() => void run("refresh", () => send({ type: "REFRESH_ALL" }))}>
                    {busy === "refresh" ? <Loader2Icon className="animate-spin" /> : <RefreshCcwIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh all feeds</TooltipContent>
              </Tooltip>
            </div>

            {error ? <div className="border-b px-4 py-2 text-sm text-destructive">{error}</div> : null}

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {state && state.articles.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {state.articles.map((article) => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      active={selectedArticle?.id === article.id}
                      onClick={() => {
                        setSelectedArticleId(article.id);
                        if (!article.isRead && state.settings.markReadOnOpen) {
                          void run("read", () => send({ type: "MARK_ARTICLE_READ", articleId: article.id }));
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <Empty className="h-full border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <RssIcon />
                    </EmptyMedia>
                    <EmptyTitle>No articles</EmptyTitle>
                    <EmptyDescription>Add a feed or adjust the current filter.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          </section>

          <section className="min-w-0 overflow-y-auto">
            {view === "reader" ? (
              <ReaderView
                article={selectedArticle}
                onToggleStar={(articleId) => void run("star", () => send({ type: "TOGGLE_STAR", articleId }))}
                onMarkRead={(articleId) => void run("read", () => send({ type: "MARK_ARTICLE_READ", articleId }))}
              />
            ) : null}
            {view === "feeds" ? (
              <FeedsView
                state={state}
                url={url}
                busy={busy}
                onUrlChange={setUrl}
                onAdd={() => void addFeed()}
                onRefresh={(feedId) => void run("refresh-feed", () => send({ type: "REFRESH_FEED", feedId }))}
                onDelete={(feedId) => void run("delete", () => send({ type: "DELETE_FEED", feedId }))}
              />
            ) : null}
            {view === "settings" && state ? (
              <SettingsView state={state} onUpdate={(settings) => void updateSettings(settings)} onMarkAll={() => void run("mark", () => send({ type: "MARK_ALL_READ" }))} />
            ) : null}
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}

function NavButton({ active, ...props }: React.ComponentProps<"button"> & { active: boolean }) {
  return (
    <button
      className="rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent"
      data-active={active}
      {...props}
    />
  );
}

function ArticleRow({ article, active, onClick }: { article: ArticleWithFeed; active: boolean; onClick: () => void }) {
  return (
    <button
      className="flex w-full gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/50 data-[active=true]:ring-2 data-[active=true]:ring-ring/30"
      data-active={active}
      onClick={onClick}
    >
      <span className="mt-2 size-2 shrink-0 rounded-full bg-primary data-[read=true]:bg-transparent" data-read={article.isRead} />
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{article.feed?.title ?? "Feed"}</span>
          <span>{relativeTime(article.publishedAt)}</span>
          {article.isStarred ? <StarIcon className="fill-current" /> : null}
        </span>
        <span className="line-clamp-2 text-sm font-medium leading-snug">{article.title}</span>
        {article.summary ? <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{article.summary}</span> : null}
      </span>
    </button>
  );
}

function ReaderView({
  article,
  onToggleStar,
  onMarkRead,
}: {
  article?: ArticleWithFeed;
  onToggleStar: (articleId: string) => void;
  onMarkRead: (articleId: string) => void;
}) {
  if (!article) {
    return (
      <Empty className="h-full rounded-none border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RssIcon />
          </EmptyMedia>
          <EmptyTitle>Select an article</EmptyTitle>
          <EmptyDescription>Your reading view will appear here.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-8 py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{article.feed?.title ?? "Feed"}</span>
            <span>{new Date(article.publishedAt).toLocaleString()}</span>
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal">{article.title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => onToggleStar(article.id)}>
            <StarIcon className={article.isStarred ? "fill-current" : ""} />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => onMarkRead(article.id)}>
            <CheckCheckIcon />
          </Button>
          <Button size="icon-sm" asChild>
            <a href={article.url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
            </a>
          </Button>
        </div>
      </div>
      {article.summary ? <p className="text-lg leading-8 text-muted-foreground">{article.summary}</p> : null}
      <Separator />
      <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content || article.summary) }} />
    </article>
  );
}

function FeedsView({
  state,
  url,
  busy,
  onUrlChange,
  onAdd,
  onRefresh,
  onDelete,
}: {
  state: AppStateSnapshot | null;
  url: string;
  busy: string;
  onUrlChange: (url: string) => void;
  onAdd: () => void;
  onRefresh: (feedId: string) => void;
  onDelete: (feedId: string) => void;
}) {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add subscription</CardTitle>
          <CardDescription>Paste a site URL or a direct RSS, Atom, or JSON Feed URL.</CardDescription>
          <CardAction>
            <Badge variant="secondary">{state?.feeds.length ?? 0} feeds</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="https://example.com/feed.xml" value={url} onChange={(event) => onUrlChange(event.target.value)} />
            <Button disabled={busy === "add"} onClick={onAdd}>
              {busy === "add" ? <Loader2Icon data-icon="inline-start" className="animate-spin" /> : <PlusIcon data-icon="inline-start" />}
              Add
            </Button>
          </div>
          {state?.detectedFeeds[0] ? (
            <button className="mt-3 text-sm text-muted-foreground hover:text-foreground" onClick={() => onUrlChange(state.detectedFeeds[0].url)}>
              Use detected feed: {state.detectedFeeds[0].title}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {state?.feeds.map((feed) => (
          <Card key={feed.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <img alt="" className="size-4 rounded-sm" src={feed.iconUrl || "/icon/16.png"} />
                <span className="truncate">{feed.title}</span>
              </CardTitle>
              <CardDescription className="truncate">{feed.url}</CardDescription>
              <CardAction>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{feed.unreadCount} unread</Badge>
                  <Button size="icon-sm" variant="outline" onClick={() => onRefresh(feed.id)}>
                    <RefreshCcwIcon />
                  </Button>
                  <Button size="icon-sm" variant="destructive" onClick={() => onDelete(feed.id)}>
                    <Trash2Icon />
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView({
  state,
  onUpdate,
  onMarkAll,
}: {
  state: AppStateSnapshot;
  onUpdate: (settings: Partial<SettingsRecord>) => void;
  onMarkAll: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon />
            Reading behavior
          </CardTitle>
          <CardDescription>Preferences are stored locally in the extension database.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SettingRow title="Mark read on open" description="Opening an article marks it as read.">
            <Switch checked={state.settings.markReadOnOpen} onCheckedChange={(checked) => onUpdate({ markReadOnOpen: checked })} />
          </SettingRow>
          <SettingRow title="Unread only" description="Hide read articles from article lists.">
            <Switch checked={state.settings.showUnreadOnly} onCheckedChange={(checked) => onUpdate({ showUnreadOnly: checked })} />
          </SettingRow>
          <SettingRow title="Refresh interval" description="Background refresh cadence in minutes.">
            <Input
              className="w-28"
              min={5}
              type="number"
              value={state.settings.refreshInterval}
              onChange={(event) => onUpdate({ refreshInterval: Number(event.target.value) || 60 })}
            />
          </SettingRow>
          <SettingRow title="Theme" description="Choose the extension color mode.">
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              value={state.settings.theme}
              onChange={(event) => onUpdate({ theme: event.target.value as SettingsRecord["theme"] })}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </SettingRow>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Library actions</CardTitle>
          <CardDescription>Quick maintenance for the local article database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onMarkAll}>
            <CheckCheckIcon data-icon="inline-start" />
            Mark all as read
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingRow({ title, description, children }: React.PropsWithChildren<{ title: string; description: string }>) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
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

function applyTheme(theme: SettingsRecord["theme"]) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && prefersDark));
}
