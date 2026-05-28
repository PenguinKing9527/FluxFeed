# 功能设计：Feed 订阅管理

## 功能概述

Feed 订阅管理是插件的核心入口功能，负责 RSS/Atom/JSON Feed 的添加、验证、更新和删除。用户可以手动输入 URL，也可以通过一键订阅从当前页面自动添加。

---

## 用户故事

- 作为用户，我希望粘贴一个网站 URL（而非 Feed URL），插件能自动发现 RSS 链接并订阅
- 作为用户，我希望在浏览博客时看到订阅按钮，一键添加当前页面的 Feed
- 作为用户，我希望能删除不再需要的订阅，且已读文章一并清理
- 作为用户，我希望对 Feed 分组，便于分类管理

---

## 功能详细设计

### 1. 手动添加 Feed

**输入**：用户在 Options 的输入框中输入 URL（支持 Feed 直链）

**处理流程**：

```
用户输入 URL
    │
    ▼
URL 格式校验（协议必须为 http/https）
    │
    ▼
Background 发起 fetch 请求
    │
    ├─ 直接返回 RSS/Atom/JSON → 解析 Feed 元信息
    │
    └─ 返回 HTML → 解析 <link rel="alternate"> 标签
              │
              ├─ 找到一个 Feed → 自动选择
              └─ 找到多个 Feed → 弹出选择列表（如 主Feed / 评论Feed）
    │
    ▼
展示 Feed 预览（标题、描述、最新 3 条文章）
    │
    ▼
用户确认 → 写入数据库 → 立即全量拉取文章
```

**错误处理**：

| 错误类型 | 用户提示 |
|---|---|
| 网络超时（>10s） | "无法连接到该地址，请检查网络或 URL 是否正确" |
| 非 RSS 内容且无 `<link>` 标签 | "未在该页面发现 RSS 订阅源" |
| 已订阅 | "已在订阅列表中，跳转到对应 Feed" |
| 解析失败 | "Feed 格式不受支持（支持 RSS 2.0 / Atom / JSON Feed）" |

---

### 2. 一键订阅（页面 RSS 检测）

**触发条件**：Content Script 在每个页面加载完成后执行检测

**检测逻辑**：

```typescript
// 检测 <link> 标签
const feedLinks = document.querySelectorAll(
  'link[rel="alternate"][type="application/rss+xml"],' +
  'link[rel="alternate"][type="application/atom+xml"],' +
  'link[rel="alternate"][type="application/feed+json"]'
);
```

**UI 交互**：
- 检测到 Feed → 扩展图标变色（橙色），Popup 顶部出现 **"订阅此页面"** 横幅
- 未检测到 → 扩展图标保持默认颜色，无额外提示

---

### 3. 分组管理

分组是 **Feed 的分类容器**，作用于订阅管理层，体现在主界面左侧导航栏，与文章标签（读后打标）是完全不同的概念。

- 用户可创建自定义分组（如"科技"、"设计"、"新闻"）
- 每个 Feed 只能属于一个分组
- 无分组的 Feed 归入默认"未分类"
- 分组支持折叠 / 展开（折叠后只显示分组名和合计未读数）
- 分组可拖拽排序（主界面左侧导航栏）
- 分组删除后，其下 Feed 移入"未分类"，不删除 Feed 本身

> **分组 vs 标签**：分组管理的是**订阅源**（哪些网站），标签管理的是**文章**（读过的内容如何归档）。两者对象不同，互不替代。详见 `features/search-and-filter.md`。

---

### 4. Feed 信息编辑

用户可对已订阅的 Feed 进行：

| 字段 | 是否可编辑 | 说明 |
|---|---|---|
| 自定义标题 | ✅ | 覆盖 Feed 原始标题 |
| 分组 | ✅ | 下拉选择已有分组 |
| 刷新间隔 | ✅ | 针对单个 Feed 设置，覆盖全局配置 |
| Feed URL | ❌ | 不可修改，需删除后重新添加 |

---

### 5. 删除订阅

- 删除时弹出确认对话框，告知"同时删除 N 篇已抓取文章"
- 支持"仅删除 Feed，保留已收藏文章"选项
- 删除操作不可撤销

---

## UI 规范

- **Feed 列表项**：显示 Favicon + 标题 + 未读数角标
- **加载状态**：输入 URL 后显示旋转加载图标，最长等待 10 秒
- **成功反馈**：Feed 添加成功后，列表以动画形式插入新项

---

## 权限需求

```json
"permissions": ["storage", "alarms", "declarativeNetRequest"],
"host_permissions": ["<all_urls>"]
```

- `<all_urls>` 是 Background SW 拉取任意域名 Feed 所必需
- Content Script 仅在用户访问的页面中注入，不主动采集用户浏览记录
