import axios from "axios";
export type ResourceType="section"|"banner"|"popup";
export interface ResourceItem {name:string;channel:string|null;position:string|null;client:string|null;exposure_pv:number|null;exposure_uv:number|null;click_pv:number|null;click_uv:number|null;jump_pv:number|null;jump_uv:number|null;play_pv:number|null;play_uv:number|null;ctr:number|null;conversion_rate:number|null;play_rate:number|null}
export interface ResourcePayload {items:ResourceItem[];summary:{exposure_uv:number|null;click_uv:number|null;jump_uv:number|null;play_uv:number|null;ctr:number|null;conversion_rate:number|null;play_rate:number|null};pagination:{page:number;page_size:number;total:number};meta:{source:string;original_fields:string[];available_dates:string[];data_status:string;limitations:string[]}}
export async function fetchResources(params:Record<string,unknown>){return (await axios.get<ResourcePayload>("/api/v1/resource-placements",{params})).data}
