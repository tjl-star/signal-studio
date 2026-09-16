import axios from "axios";

export type ContentListType = "总榜" | "新用户榜";
export type ContentSort = "rank" | "play_vv" | "day_change";
export type SortDirection = "asc" | "desc";

export interface ContentRankingItem {
  date: string;
  list_type: ContentListType;
  rank: number;
  title: string;
  season_id: string | null;
  play_uv: number | null;
  play_vv: number | null;
  day_change_rate: number | null;
  day_change_text: string;
  week_change_rate: number | null;
  week_change_text: string;
  collection_type: string | null;
  content_category: string | null;
  genre_tags: string | null;
  ranking_status: string | null;
  data_status: string;
  source_interface: string;
  limitation: string | null;
}

export interface ContentRankingPayload {
  items: ContentRankingItem[];
  top10: ContentRankingItem[];
  pagination: { page: number; page_size: number; total: number };
  meta: {
    source: string;
    component: string;
    original_fields: string[];
    filters: Record<string, string>;
    available_dates: string[];
    data_status: "snapshot";
    unsupported_list_types: string[];
  };
}

export interface ContentRankingFilters {
  date: string;
  listType: ContentListType;
  page: number;
  pageSize: number;
  sort: ContentSort;
  direction: SortDirection;
}

export async function fetchContentRankings(filters: ContentRankingFilters): Promise<ContentRankingPayload> {
  const response = await axios.get<ContentRankingPayload>("/api/v1/content-rankings", {
    params: {
      date: filters.date,
      list_type: filters.listType,
      page: filters.page,
      page_size: filters.pageSize,
      sort: filters.sort,
      direction: filters.direction
    }
  });
  return response.data;
}
