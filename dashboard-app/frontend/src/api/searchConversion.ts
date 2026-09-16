import axios from "axios";

export interface SearchConversionRow {
  date: string;
  into_search_click_uv: number | null;
  search_suc_uv: number | null;
  result_content_click_uv: number | null;
  result_video_after_ad_play_start_uv: number | null;
  result_play_5mins_uv: number | null;
  search_suc_uv_ratio: number | null;
  ff_play_uv_rate: number | null;
  play_5min_uv_rate: number | null;
  result_play_time_uv: number | null;
}

export interface SearchConversionPayload {
  current: SearchConversionRow | null;
  previous: SearchConversionRow | null;
  trend: SearchConversionRow[];
  meta: { source: string; component: string; api_id: string; client_scope: string; original_fields: string[]; available_dates: string[]; data_status: string };
}

export async function fetchSearchConversion(date: string, startDate: string, endDate: string) {
  const response = await axios.get<SearchConversionPayload>("/api/v1/search-conversion", { params: { date, start_date: startDate, end_date: endDate } });
  return response.data;
}
