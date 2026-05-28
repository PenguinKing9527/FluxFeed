# RSS Reader 插件 — 架构设计文档

## 总体架构

浏览器扩展由三个隔离的运行上下文组成，通过 Chrome Extensions Message Passing 通信：

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Extension                        │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   Popup UIOPtions UI  │    │ Background (SW)  │    │Content Script│  │
│  │  (React App) │◄──►│  Service Worker  │◄──►│ (页面 RSS 检测)│  │
│  └──────────────┘    └────────┬─────────┘    └──────────────┘  │
│                               │                                 │
│                       ┌───────▼────────┐                       │
│                       │  IndexedDB     │                       │
│                       │  (本地数据库)   │                       │
│                       └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  外部 RSS Feed 源    │
                    │  (互联网 HTTP/HTTPS) │
                    └─────────────────────┘
```

---

## 各层职责

### 1. Popup UI（弹窗界面）和options界面

- **运行时**：独立 HTML 页面，点击扩展图标触发
- **技术栈**：React 18 + Zustand + CSS Modules
- **职责**：
  - 渲染 Feed 列表、文章列表、阅读视图
  - 通过 `chrome.runtime.sendMessage` 向 Background 发送指令
  - 监听来自 Background 的状态更新推送
- **限制**：窗口关闭后进程销毁，不可执行后台任务

### 2. Background Service Worker

- **运行时**：持久化后台进程（Manifest V3 Alarms 唤醒）
- **职责**：
  - 定时拉取所有 Feed（使用 `chrome.alarms` API）
  - 执行 RSS / Atom / JSON Feed 解析
  - 读写 IndexedDB 数据库
  - 更新扩展图标 Badge（未读计数）
  - 处理 CORS 敏感的网络请求（绕过页面同源限制）
- **限制**：MV3 SW 空闲后会被终止，所有状态必须持久化到 IndexedDB

### 3. Content Script（内容脚本）

- **运行时**：注入到每个网页的上下文
- **职责**：
  - 检测当前页面 `<link rel="alternate" type="application/rss+xml">` 标签
  - 将检测结果发送给 Background，触发 Popup 显示"订阅"按钮
- **权限**：仅读取 DOM，不写入，最小权限原则

---

## 数据架构（IndexedDB Schema）

使用 **Dexie.js** 作为 IndexedDB 封装层。

### 数据库名：`rss-reader-db`，版本：`1`

```typescript
// feeds 表 — 订阅源
interface Feed {
  id: string;           // UUID，主键
  url: string;          // Feed 地址（唯一索引）
  title: string;        // Feed 标题
  description: string;  // Feed 描述
  siteUrl: string;      // 对应网站首页
  iconUrl: string;      // Favicon URL
  groupId: string;      // 所属分组 ID（可选）
  refreshInterval: number; // 刷新间隔（分钟），0 = 跟随全局设置
  lastFetchedAt: number;   // 上次成功拉取时间戳
  errorCount: number;      // 连续失败次数
  createdAt: number;
}

// articles 表 — 文章
interface Article {
  id: string;           // UUID，主键
  feedId: string;       // 关联 Feed ID（索引）
  guid: string;         // 文章原始 GUID（唯一标识，防重复，复合索引 feedId+guid）
  title: string;
  url: string;
  author: string;
  summary: string;      // 摘要（纯文本，最多 500 字）
  content: string;      // 完整正文 HTML
  publishedAt: number;  // 发布时间戳（索引，用于排序）
  isRead: boolean;      // 已读状态（索引）
  isStarred: boolean;   // 收藏状态（索引）
  tags: string[];       // 用户标签
  fetchedAt: number;    // 抓取时间戳
}

// groups 表 — 分组
interface Group {
  id: string;
  name: string;
  order: number;        // 排序权重
  createdAt: number;
}

// settings 表 — 全局配置（单行，id = 'global'）
interface Settings {
  id: 'global';
  refreshInterval: number;    // 全局刷新间隔（分钟），默认 60
  maxArticlesPerFeed: number; // 每个 Feed 最多保留文章数，默认 200
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  markReadOnOpen: boolean;
  showUnreadOnly: boolean;
}
```

### 索引设计

```
feeds:    ++id, &url, groupId, lastFetchedAt
articles: ++id, feedId, [feedId+guid], publishedAt, isRead, isStarred
groups:   ++id, order
```

---

## 消息通信协议

所有 Popup ↔ Background 通信通过 `chrome.runtime.sendMessage` 实现，采用统一的 Action 结构：

```typescript
// 请求格式
interface Message<T = unknown> {
  action: MessageAction;
  payload?: T;
}

// 响应格式
interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Action 枚举
type MessageAction =
  | 'FEED_ADD'          // 添加订阅
  | 'FEED_DELETE'       // 删除订阅
  | 'FEED_REFRESH'      // 手动刷新单个 Feed
  | 'FEED_REFRESH_ALL'  // 刷新全部 Feed
  | 'ARTICLE_MARK_READ' // 标记已读
  | 'ARTICLE_STAR'      // 收藏文章
  | 'ARTICLE_MARK_ALL_READ' // 全部标记已读
  | 'SETTINGS_UPDATE'   // 更新设置
  | 'OPML_IMPORT'       // 导入 OPML
  | 'OPML_EXPORT'       // 导出 OPML
  | 'PAGE_FEED_DETECTED'; // 内容脚本检测到 RSS 链接
```

---

## Feed 刷新流程

```
chrome.alarms 触发
       │
       ▼
Background SW 唤醒
       │
       ▼
从 IndexedDB 读取所有 Feeds
       │
       ├── 对每个 Feed 并发 fetch（最大并发数 5）
       │         │
       │         ▼
       │    解析 RSS / Atom / JSON Feed
       │         │
       │         ▼
       │    对比已有 article.guid，去重
       │         │
       │         ▼
       │    批量写入新文章到 IndexedDB
       │         │
       │         ▼
       │    更新 Feed.lastFetchedAt
       │
       ▼
统计全局未读数
       │
       ▼
更新 chrome.action.setBadgeText（未读数角标）
       │
       ▼
（若 Popup 已打开）chrome.runtime.sendMessage 推送刷新通知
```

---

## RSS 解析器设计

解析器使用rss-parser，安全使用DOMPurify

---

## 目录结构

```
rss-reader-extension/
├── public/
│   ├── icons/              # 扩展图标（16/48/128px）
│   └── manifest.json
├── src/
│   ├── background/
│   │   ├── index.ts        # Service Worker 入口
│   │   ├── alarm.ts        # 定时刷新逻辑
│   │   ├── fetcher.ts      # HTTP 拉取 Feed
│   │   └── message-handler.ts
│   ├── content/
│   │   └── detector.ts     # 页面 RSS 检测
│   ├── parser/
│   │   ├── index.ts        # 解析器入口（格式路由）
│   │   ├── rss.ts          # RSS 2.0 解析
│   │   ├── atom.ts         # Atom 1.0 解析
│   │   └── json-feed.ts    # JSON Feed 解析
│   ├── db/
│   │   ├── schema.ts       # Dexie 数据库定义
│   │   ├── feeds.ts        # Feed CRUD
│   │   └── articles.ts     # Article CRUD
│   ├── popup（and options）/
│   │   ├── index.tsx       # Popup and options 入口
│   │   ├── App.tsx
│   │   ├── store/          # Zustand store
│   │   ├── components/     # React 组件
│   │   │   ├── FeedList/
│   │   │   ├── ArticleList/
│   │   │   ├── ArticleReader/
│   │   │   └── Settings/
│   │   └── hooks/          # 自定义 React Hooks
│   └── shared/
│       ├── types.ts        # 全局类型定义
│       └── constants.ts
├── docs/                   # 本设计文档目录
├── tests/
│   ├── unit/
│   └── e2e/
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 安全考量

| 威胁 | 缓解措施 |
|---|---|
| XSS（RSS 正文注入脚本） | 使用 `DOMParser` 解析后，通过白名单清洗 HTML 标签（自实现 sanitizer 或 DOMPurify） |
| 恶意 Feed URL | 仅允许 `http://` 和 `https://` 协议；校验响应 Content-Type |
| 数据泄露 | 所有数据本地存储，无外部服务；同步功能为可选项 |
| 权限最小化 | Content Script 仅请求 `<all_urls>` 的读取权限，不注入任何修改脚本 |
