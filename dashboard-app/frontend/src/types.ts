import type { MetricKey } from "./domain/overview";

export type MetricValues = Record<MetricKey, number | null>;

export interface OverviewTrendRow extends MetricValues {
  date: string;
}

export interface OverviewClientRow extends MetricValues {
  date: string;
  client: string;
}

export interface OverviewPayload {
  summary: MetricValues;
  comparison: MetricValues;
  trend: OverviewTrendRow[];
  client_breakdown: OverviewClientRow[];
  meta: {
    source: string;
    component: string;
    original_fields: string[];
    filters: Record<string, string>;
    data_status: "snapshot" | "fresh" | "stale";
    client_breakdown_scope: string;
  };
}
