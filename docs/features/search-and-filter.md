# 功能设计：搜索与过滤

## 功能概述

搜索与过滤功能让用户在本地文章库中快速定位内容。所有搜索均在本地执行，无网络请求，响应即时。过滤器是主界面的核心导航元素，而非独立的弹出面板。

---

## 用户故事

- 作为用户，我希望能搜索文章标题和正文，找到我之前看过的内容
- 作为用户，我希望在主界面直接切换"全部 / 未读"，无需进入子页面
- 作为用户，我希望屏蔽某些关键词，让特定话题的文章不出现

---


└──────────┴──────────────────────────┘
```

### Tab 说明

| Tab | 过滤条件 | 角标 |
|---|---|---|
| 全部 | 无过滤，显示所有文章 | 无 |
| 未读 | `isRead = false` | 显示未读总数 |
| ⭐ 收藏 | `isStarred = true` | 显示收藏总数 |

Tab 状态持久化到本地设置，下次打开 Popup 恢复上次选中的 Tab。

### 与左侧 Feed 列表联动

左侧 Feed 列表（分组导航）与顶部 Tab 过滤器**叠加生效**：

- 点击"科技"分组 → 右侧显示科技类 Feed 的文章
- 再点击"未读" Tab → 右侧显示科技类 Feed 中的未读文章
- 点击"全部 Feed"（根节点） → 取消来源过滤，仅保留 Tab 过滤

无需独立的"来源过滤面板"，左侧导航本身就是来源维度的过滤器。

---

## 搜索设计

### 搜索范围

| 字段 | 是否搜索 | 权重 |
|---|---|---|
| 文章标题 | ✅ | 高（3x） |
| 文章摘要 | ✅ | 中（1x） |
| 文章正文 | ✅ | 低（0.5x） |
| 作者名 | ✅ | 中（1x） |
| Feed 名称 | ✅ | 中（1x） |

### 搜索实现

由于数据完全在本地，采用基于 Dexie.js 的内存过滤方案：

```typescript
async function searchArticles(query: string): Promise<Article[]> {
  if (!query.trim()) return [];

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  // 从 IndexedDB 读取最近 30 天的文章（时间范围限制提升性能）
  const candidates = await db.articles
    .where('publishedAt')
    .aboveOrEqual(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toArray();

  // 内存过滤 + 评分
  const scored = candidates
    .map(article => ({
      article,
      score: computeRelevanceScore(article, terms)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 50).map(({ article }) => article);
}
```

### 搜索 UI

- 搜索框常驻在 Popup 顶部（快捷键 `/` 聚焦）
- 输入后 300ms 防抖触发搜索（避免频繁查询）
- 搜索词高亮显示在结果列表中
- 无结果时显示提示："未找到含「xxx」的文章，[搜索更长时间范围]"
- 搜索激活时，顶部 Tab 导航和左侧 Feed 列表**收起**，全屏展示搜索结果；按 `Esc` 退出搜索恢复原布局

---

## 关键词过滤（屏蔽词）

屏蔽词是**内容层面的自动过滤**，与上方的 Tab 导航/Feed 导航是不同维度，配置入口在设置页面而非主界面。

### 功能说明

用户可设置屏蔽词列表，包含屏蔽词的文章在列表中不显示（仍然存储在数据库，可在设置中查看/清理）。

### 屏蔽规则

```typescript
interface BlockRule {
  id: string;
  pattern: string;        // 屏蔽词，支持通配符 *
  scope: 'title' | 'all'; // 仅标题 or 全文
  feedId?: string;        // 指定 Feed（空 = 全局生效）
  createdAt: number;
}
```

**示例规则**：
- `广告` + 仅标题 → 过滤标题含"广告"的文章
- `crypto*` + 全文 → 过滤含 crypto 开头词汇的文章
- `promoted` + 全文 + feedId=xxx → 仅对特定 Feed 过滤

### 性能考量

- 屏蔽规则在文章写入 IndexedDB 时实时应用（打标 `isBlocked`）
- 列表查询时自动排除 `isBlocked = true` 的文章
- 屏蔽规则变更时，对现有文章批量重新评估（后台任务，不阻塞 UI）

---

## 标签系统

> **重要：标签（文章维度）≠ 分组（Feed 维度），两者对象不同，功能互补。**
>
> - **分组**：对 Feed 进行分类（如"科技类博客"），是**订阅管理**维度，在左侧导航体现
> - **标签**：对文章进行标注（如"值得二读"），是**阅读整理**维度，读后手动打标

用户可给文章手动添加标签：

- 标签为纯文本字符串，如 "值得二读"、"技术参考"、"待调研"
- 一篇文章可添加多个标签
- 标签入口：阅读视图底部 + 列表项右键菜单
- 标签可在搜索中使用（输入 `tag:值得二读` 过滤）
- 标签列表在**设置 → 标签管理**中统一管理（支持重命名、合并、删除）

```typescript
// 标签过滤（搜索语法解析）
const articles = await db.articles
  .filter(a => a.tags.includes('值得二读'))
  .toArray();
```
