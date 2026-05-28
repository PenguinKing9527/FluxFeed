# 功能设计：自动刷新与通知

## 功能概述

自动刷新功能让插件在后台定时拉取所有订阅源，确保用户随时可以看到最新文章。结合浏览器扩展图标角标，用户无需打开 Popup 即可感知未读数量变化。

---

## 用户故事

- 作为用户，我希望插件自动拉取新文章，无需手动刷新
- 作为用户，我希望在浏览器工具栏看到未读文章数量
- 作为用户，我希望可以设置刷新间隔（节省流量 / 追求实时）
- 作为用户，我希望某些 Feed 可以有独立的刷新频率

---

## 刷新策略

### 全局刷新间隔

用户可在设置中选择全局刷新时间


---

## 技术实现（wxt）

Manifest V3 的 Service Worker 为非持久化进程，不能使用 `setInterval`。必须使用 `chrome.alarms` API：

```typescript
// background/alarm.ts

// 初始化：扩展安装/更新时创建 Alarm
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('global-refresh', {
    periodInMinutes: 60  // 默认 1 小时
  });
});

// 监听 Alarm 触发
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'global-refresh') {
    await refreshAllFeeds();
  }
});

// 用户修改间隔时更新 Alarm
async function updateRefreshAlarm(intervalMinutes: number) {
  await chrome.alarms.clear('global-refresh');
  if (intervalMinutes > 0) {
    chrome.alarms.create('global-refresh', {
      periodInMinutes: intervalMinutes
    });
  }
}
```

---

## 并发控制

为避免同时大量请求外部服务器导致被封锁或性能问题，采用并发池控制：

```
所有待刷新 Feeds
       │
       ▼
  并发队列（最大并发 5）
  ┌───┬───┬───┬───┬───┐
  │ F1│ F2│ F3│ F4│ F5│  ← 同时进行
  └───┴───┴───┴───┴───┘
  某个完成后，从队列取出下一个
       │
       ▼
  全部完成 → 更新 Badge
```

---

## 错误处理与重试

| 场景 | 处理 |
|---|---|
| HTTP 4xx（Feed 已失效） | 记录错误，Feed 列表显示警告图标，不重试 |
| HTTP 5xx / 网络超时 | 记录 `errorCount++`，下次刷新周期正常重试 |
| 连续失败 5 次 | Feed 自动进入"暂停"状态，用户需手动重新启用 |
| 解析错误 | 记录错误信息到 Feed，不影响其他 Feed 刷新 |

---

## 未读角标（Badge）

### 显示规则

```typescript
async function updateBadge() {
  const unreadCount = await db.articles
    .where('isRead').equals(false)
    .count();

  if (unreadCount === 0) {
    chrome.action.setBadgeText({ text: '' });  // 无角标
  } else if (unreadCount > 999) {
    chrome.action.setBadgeText({ text: '999+' });
  } else {
    chrome.action.setBadgeText({ text: String(unreadCount) });
  }

  chrome.action.setBadgeBackgroundColor({ color: '#E85D3A' });
}
```

### 触发更新的时机

- 完成一次全局刷新后
- 用户标记文章已读后（Popup 通知 Background 更新）
- 用户全部标记已读后

---

## 手动刷新

用户在 Popup 中可触发：

- **刷新全部**：工具栏刷新按钮，同时刷新所有 Feed，显示全局加载动画
- **刷新单个**：Feed 项右键菜单 → "立即刷新"，或 Feed 详情页顶部刷新图标

刷新中状态：Feed 列表项显示旋转图标，刷新完成后显示"刚刚更新"时间戳。

---

## 数据清理策略

为防止 IndexedDB 无限膨胀：

- 每个 Feed 最多保留 **200 篇**文章（可在设置中调整：50 / 100 / 200 / 500 / 不限制）
- 超出时删除最旧的已读文章（未读文章不删除）
- 已收藏文章永久保留，不受限制

清理时机：每次全局刷新完成后执行一次清理检查。
