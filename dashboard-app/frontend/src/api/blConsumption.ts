import axios from "axios";
export interface BlItem{rank:number;season_id:string;title:string;genre:string|null;content_type:string|null;topic_tags:string|null;producer_region:string|null;play_vv:number;play_uv:number;avg_play_count:number|null}
export interface BlPayload{summary:null|{period_start:string;period_end:string;total_play_vv:number;total_content_play_uv:number;bl_play_vv:number;bl_content_play_uv:number;bl_vv_share:number;bl_avg_play_count:number};items:BlItem[];periods:{start:string;end:string}[];meta:{source:string;component:string;original_fields:string[];rule:string;limitation:string}}
export async function fetchBlConsumption(params:Record<string,unknown>={}){return(await axios.get<BlPayload>("/api/v1/bl-consumption",{params})).data}
