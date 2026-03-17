// Sidebar 工具函数

export function formatConversationDate(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < minute) {
    return "Just now";
  }

  if (delta < hour) {
    return `${Math.max(1, Math.floor(delta / minute))}m ago`;
  }

  if (delta < day) {
    return `${Math.floor(delta / hour)}h ago`;
  }

  if (delta < day * 7) {
    return `${Math.floor(delta / day)}d ago`;
  }

  return new Date(timestamp).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}
