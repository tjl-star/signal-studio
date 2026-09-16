import { describe, expect, it } from "vitest";

import { formatClientMetric, formatMetric, formatRelativeChange } from "./overview";

describe("overview display contract", () => {
  it("formats counts, rates and durations by metric meaning", () => {
    expect(formatMetric("device_dau", 120509)).toBe("120,509");
    expect(formatMetric("play_rate", 0.692)).toBe("69.20%");
    expect(formatMetric("avg_watch_duration", 66.6971)).toBe("66.7 分钟");
    expect(formatMetric("avg_play_count", null)).toBe("--");
  });

  it("formats client breakdown values using the legacy table precision", () => {
    expect(formatClientMetric("device_dau", 572153)).toBe("572,153");
    expect(formatClientMetric("play_rate", 0.7641)).toBe("76.41%");
    expect(formatClientMetric("avg_watch_duration", 67.8048)).toBe("67.8 分钟");
    expect(formatClientMetric("avg_play_count", 8.4262)).toBe("8.426");
    expect(formatClientMetric("avg_play_count", null)).toBe("--");
  });

  it("formats comparison direction without inventing a value", () => {
    expect(formatRelativeChange(0.2)).toEqual({ text: "+20.00%", tone: "up" });
    expect(formatRelativeChange(-0.05)).toEqual({ text: "-5.00%", tone: "down" });
    expect(formatRelativeChange(null)).toEqual({ text: "暂无对比", tone: "flat" });
  });
});
