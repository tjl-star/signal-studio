export type MetricKey =
  | "device_dau"
  | "new_device"
  | "play_rate"
  | "avg_watch_duration"
  | "avg_play_count";

export type ComparisonTone = "up" | "down" | "flat";

const numberFormatter = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });

export function formatMetric(metric: MetricKey, value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (metric === "play_rate") return `${(value * 100).toFixed(2)}%`;
  if (metric === "avg_watch_duration") return `${value.toFixed(1)} 分钟`;
  if (metric === "avg_play_count") return value.toFixed(2);
  return numberFormatter.format(value);
}

export function formatRelativeChange(value: number | null | undefined): {
  text: string;
  tone: ComparisonTone;
} {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return { text: "暂无对比", tone: "flat" };
  }
  if (value === 0) return { text: "0.00%", tone: "flat" };
  return {
    text: `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%`,
    tone: value > 0 ? "up" : "down"
  };
}

export function formatClientMetric(metric: MetricKey, value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "--";
  if (metric === "play_rate") return `${(value * 100).toFixed(2)}%`;
  if (metric === "avg_watch_duration") return `${value.toFixed(1)} 分钟`;
  if (metric === "avg_play_count") return value.toFixed(3);
  return numberFormatter.format(value);
}
