# 功能设计：OPML 导入 / 导出

## 功能概述

OPML（Outline Processor Markup Language）是 RSS 阅读器之间迁移订阅列表的通用格式。本功能支持从其他阅读器（如 Feedly、Inoreader、Reeder）导入订阅源，也支持将当前订阅列表导出备份。

---

## 用户故事

- 作为用户，我希望从 Feedly 迁移到本插件，不需要逐个重新添加订阅
- 作为用户，我希望备份我的订阅列表，防止数据丢失
- 作为用户，我希望在多台设备间同步订阅列表（通过 OPML 手动同步）

---

## OPML 格式支持

### 导入支持的格式

标准 OPML 2.0 格式（主流阅读器均兼容）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>RSS Subscriptions</title>
  </head>
  <body>
    <!-- 分组（文件夹） -->
    <outline text="Technology" title="Technology">
      <outline
        type="rss"
        text="Hacker News"
        title="Hacker News"
        xmlUrl="https://news.ycombinator.com/rss"
        htmlUrl="https://news.ycombinator.com" />
    </outline>

    <!-- 无分组的 Feed -->
    <outline
      type="rss"
      text="Example Blog"
      xmlUrl="https://example.com/feed.xml" />
  </body>
</opml>
```

### 字段映射

| OPML 属性 | 插件字段 | 备注 |
|---|---|---|
| `xmlUrl` | `feed.url` | 必需，缺少则跳过 |
| `text` / `title` | `feed.title` | 优先取 `title` |
| `htmlUrl` | `feed.siteUrl` | 可选 |
| 父级 `outline.text` | `group.name` | 自动创建分组 |

---

## 导入流程

```
用户选择 .opml 文件（File Picker）
       │
       ▼
解析 OPML XML
       │
       ▼
提取 Feed 列表（含分组信息）
       │
       ▼
展示导入预览：
  - 共 N 个 Feed，M 个分组
  - 列出 Feed 标题和 URL
  - 标记"已存在"的 Feed（将跳过）
       │
       ▼
用户确认导入
       │
       ▼
批量写入 Feeds 到数据库（去重已存在的）
       │
       ▼
后台分批拉取新 Feed 的文章（见"大批量拉取策略"）
       │
       ▼
完成：显示"已成功导入 N 个订阅源，跳过 M 个已存在，失败 K 个"
```

### 错误处理

| 错误 | 处理方式 |
|---|---|
| 文件格式不是 OPML | 提示"请选择 .opml 文件" |
| XML 解析失败 | 提示"文件格式有误，无法解析" |
| 部分 Feed URL 无效 | 跳过无效项，在结果中列出失败的 Feed |
| 导入中断（关闭 Popup）| 已写入的 Feed 保留，未完成的文章拉取在后台继续 |

---

## 大批量导入的文章拉取策略

用户从 Feedly 等平台迁移时，可能一次导入几十乃至几百个 Feed。若同时全量拉取，会造成网络拥塞、内存占用过高、服务器被封等问题。采用以下组合策略：

### 1. 分批并发队列，批次间降速

```
全部新 Feed（假设 300 个）
       │
       ▼
  优先队列（按 Feed 字母序/分组序入队）
       │
  每批 5 个并发拉取
  ├── 批次完成后，等待 1.5 秒再开始下一批
  └── 用户手动触发"立即全部刷新"时取消等待间隔
```

等待间隔目的：避免短时间内对同一域名发送大量请求，降低被限速/封锁的风险。

### 2. 首次只拉最新 10 篇

初次订阅（包括批量导入）每个 Feed 只拉取最新 10 篇文章，让用户快速看到内容。后续正常刷新周期再补全历史文章（最多补到 `maxArticlesPerFeed` 上限）。

```typescript
const INITIAL_FETCH_LIMIT = 10;   // 首次导入每个 Feed 只取最新 10 篇
const BATCH_SIZE = 5;             // 并发拉取批次大小
const BATCH_DELAY_MS = 1500;      // 批次间等待时长
```

### 3. Popup 关闭不中断，进度可恢复

拉取任务在 Background Service Worker 中执行，关闭 Popup 不影响进度。任务状态持久化到 IndexedDB：

```typescript
interface ImportTask {
  id: string;
  totalFeeds: number;
  completedFeeds: number;   // 已完成数量
  failedFeeds: string[];    // 失败的 Feed URL 列表
  status: 'running' | 'done' | 'error';
  startedAt: number;
}
```

再次打开 Popup 时，若有进行中的导入任务，顶部显示进度条和当前状态（"正在拉取第 23/300 个 Feed..."）。

### 4. 单个失败静默跳过

任何单个 Feed 拉取失败（超时、解析错误、HTTP 错误）不阻塞整体进度，记录到 `failedFeeds` 列表。全部完成后汇总显示：

```
导入完成
✅ 成功拉取 287 个 Feed
⚠️  13 个 Feed 拉取失败（网络错误或格式不支持）
   [查看失败列表]  [重试失败项]
```

### 5. UI 进度展示

```
┌─────────────────────────────────────┐
│  正在初始化订阅源...                │
│  ████████████░░░░░░░░  145 / 300    │
│  当前：Hacker News                  │
│                           [后台运行]│
└─────────────────────────────────────┘
```

点击"后台运行"后，进度条收起为顶部细线，用户可正常浏览已拉取完成的 Feed 文章。

---

## 导出流程

```
用户点击"导出 OPML"
       │
       ▼
从数据库读取所有 Feeds 和 Groups
       │
       ▼
生成 OPML XML 字符串
       │
       ▼
通过 chrome.downloads API 触发下载
文件名：rss-backup-YYYY-MM-DD.opml
```

### 导出内容

- 所有已订阅的 Feed（包含分组结构）
- 不包含文章内容（文章过多，OPML 标准也不包含文章）
- 不包含已读状态、收藏等个人数据

### 生成示例

```typescript
function generateOPML(feeds: Feed[], groups: Group[]): string {
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // 按分组组织 Feeds
  const grouped = new Map<string | null, Feed[]>();
  for (const feed of feeds) {
    const key = feed.groupId || null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(feed);
  }

  // 生成 XML
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>RSS Reader Export ${new Date().toISOString().slice(0, 10)}</title>`,
    '  </head>',
    '  <body>',
  ];

  // ... 生成分组和 Feed outline
  return lines.join('\n');
}
```

---

## 设置页面入口

OPML 导入/导出功能位于 **设置 → 数据管理** 页面：

```
数据管理
├── 导入订阅列表      [选择 OPML 文件]
├── 导出订阅列表      [下载 OPML]
├── 清空所有文章      [危险操作，二次确认]
└── 重置插件          [清空所有数据，恢复出厂]
```
