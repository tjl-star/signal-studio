import axios from "axios";

import type { OverviewPayload } from "../types";

export interface OverviewFilters {
  startDate: string;
  endDate: string;
  client: string;
}

export async function fetchOverview(filters: OverviewFilters): Promise<OverviewPayload> {
  const response = await axios.get<OverviewPayload>("/api/v1/overview", {
    params: {
      start_date: filters.startDate,
      end_date: filters.endDate,
      client: filters.client
    }
  });
  return response.data;
}
