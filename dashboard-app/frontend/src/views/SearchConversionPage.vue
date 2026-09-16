<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { InfoFilled, RefreshRight } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { fetchSearchConversion, type SearchConversionPayload, type SearchConversionRow } from "../api/searchConversion";
import { useThemeStore } from "../stores/theme";

const TrendChart = defineAsyncComponent(() => import("../components/ContentRankingChart.vue"));
const route = useRoute();
const router = useRouter();
const theme = useThemeStore();
const date = ref(typeof route.query.date === "string" ? route.query.date : "2026-09-15");
const range = ref<[string, string]>(["2026-09-09", "2026-09-15"]);
const data = ref<SearchConversionPayload | null>(null);
const loading = ref(false);
const error = ref("");
const sourceDrawer = ref(false);
const nf = new Intl.NumberFormat("zh-CN");
const stages: Array<[string, keyof SearchConversionRow]> = [
  ["进入搜索页 UV", "into_search_click_uv"], ["搜索完成 UV", "search_suc_uv"], ["影视点击 UV", "result_content_click_uv"],
  ["详情页起播 UV", "result_video_after_ad_play_start_uv"], ["播放 5 分钟 UV", "result_play_5mins_uv"]
];
const rates: Array<[string, keyof SearchConversionRow]> = [["搜索完成率", "search_suc_uv_ratio"], ["首帧转化率", "ff_play_uv_rate"], ["5 分钟转化率", "play_5min_uv_rate"]];
function number(value: number | null | undefined) { return value == null ? "--" : nf.format(value); }
function percent(value: number | null | undefined) { return value == null ? "--" : `${(value * 100).toFixed(2)}%`; }
function delta(key: keyof SearchConversionRow) {
  const current = Number(data.value?.current?.[key]); const previous = Number(data.value?.previous?.[key]);
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / previous;
}
function adjacentRate(index: number) {
  if (!index || !data.value?.current) return null;
  const value = Number(data.value.current[stages[index][1]]); const before = Number(data.value.current[stages[index - 1][1]]);
  return before ? value / before : null;
}
async function load() {
  loading.value = true; error.value = "";
  router.replace({ query: { date: date.value, start_date: range.value[0], end_date: range.value[1] } });
  try { data.value = await fetchSearchConversion(date.value, range.value[0], range.value[1]); }
  catch (reason) { error.value = "搜索转化数据加载失败，请确认快照已经导入。"; console.error(reason); }
  finally { loading.value = false; }
}
const chartOption = computed(() => ({
  animationDuration: 220, color: [theme.current.primary, theme.current.secondary], tooltip: { trigger: "axis" },
  legend: { data: ["进入搜索页 UV", "播放 5 分钟 UV"], top: 4, textStyle: { color: "#6f7480" } },
  grid: { left: 70, right: 24, top: 42, bottom: 34 },
  xAxis: { type: "category", data: data.value?.trend.map(row => row.date.slice(5)) ?? [], axisLine: { lineStyle: { color: "#e6e7eb" } }, axisLabel: { color: "#7a8492" } },
  yAxis: { type: "value", axisLabel: { color: "#7a8492" }, splitLine: { lineStyle: { color: "#eef1f4" } } },
  series: [
    { name: "进入搜索页 UV", type: "line", smooth: true, symbolSize: 6, data: data.value?.trend.map(row => row.into_search_click_uv) ?? [] },
    { name: "播放 5 分钟 UV", type: "line", smooth: true, symbolSize: 6, data: data.value?.trend.map(row => row.result_play_5mins_uv) ?? [] }
  ]
}));
onMounted(load);
</script>

<template>
  <main class="main-content page-stack search-conversion-page">
    <header class="page-intro"><div><h2>搜索整体转化漏斗</h2><p>搜索入口到播放消费的同口径用户链路。</p></div><div class="page-intro-actions"><span class="page-date">全客户端</span><button class="source-button" @click="sourceDrawer = true"><el-icon><InfoFilled /></el-icon>数据说明</button></div></header>
    <section class="filter-bar conversion-filter" aria-label="搜索转化筛选"><label><span>数据日期</span><el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" /></label><label><span>趋势范围</span><el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" /></label><el-button type="primary" :loading="loading" @click="load"><el-icon><RefreshRight /></el-icon>更新视图</el-button><div class="freshness"><span class="status-dot"></span><div><b>{{ data?.meta.data_status === 'local_mcp_sync' ? 'MCP 本地同步' : 'Quick BI 数据' }}</b><small>{{ data?.meta.component ?? '--' }}</small></div></div></section>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <section v-loading="loading" class="panel funnel-panel">
      <div class="panel-head"><div><h2>用户转化链路</h2><p>相邻转化率按相邻阶段 UV 计算，不虚构流失字段</p></div><span>{{ date }}</span></div>
      <div v-if="data?.current" class="funnel-layout"><div class="funnel-stages"><template v-for="(stage, index) in stages" :key="stage[1]"><article class="funnel-stage"><span><b>0{{ index + 1 }}</b>{{ stage[0] }}</span><strong>{{ number(Number(data.current[stage[1]])) }}</strong><small>{{ index ? `相邻转化 ${percent(adjacentRate(index))}` : '起始节点' }}<em v-if="delta(stage[1]) !== null" :class="delta(stage[1])! >= 0 ? 'change-up' : 'change-down'">{{ delta(stage[1])! >= 0 ? '↑' : '↓' }}{{ Math.abs(delta(stage[1])! * 100).toFixed(1) }}%</em></small></article><div v-if="index < stages.length - 1" class="funnel-arrow">↓</div></template></div>
        <aside class="overall-rate-panel"><span>整体转化率</span><article v-for="item in rates" :key="item[1]"><small>{{ item[0] }}</small><strong>{{ percent(Number(data.current[item[1]])) }}</strong><em v-if="delta(item[1]) !== null" :class="delta(item[1])! >= 0 ? 'change-up' : 'change-down'">较前日 {{ delta(item[1])! >= 0 ? '↑' : '↓' }}{{ Math.abs(delta(item[1])! * 100).toFixed(1) }}%</em></article><article><small>人均播放时长</small><strong>{{ data.current.result_play_time_uv ?? '--' }}</strong><em>保留原始单位</em></article></aside></div>
      <div v-else-if="!loading" class="empty-state"><strong>当前日期暂无数据</strong><span>请选择已同步的日期。</span></div>
    </section>
    <section class="panel"><div class="panel-head"><div><h2>搜索入口与深度播放趋势</h2><p>当前选择范围内的真实日数据</p></div><span>{{ range[0] }} 至 {{ range[1] }}</span></div><Suspense v-if="data?.trend.length"><TrendChart class="conversion-chart" :option="chartOption" /><template #fallback><div class="chart-loading">图表加载中</div></template></Suspense><div v-else-if="!loading" class="empty-state"><strong>趋势范围暂无数据</strong></div></section>
    <el-drawer v-model="sourceDrawer" title="搜索转化来源与口径" size="440px"><div class="source-drawer"><section><span>数据源</span><strong>{{ data?.meta.source ?? '--' }}</strong></section><section><span>接口 / 组件</span><strong>{{ data?.meta.component ?? '--' }} / {{ data?.meta.api_id ?? '--' }}</strong></section><section><span>客户端口径</span><strong>{{ data?.meta.client_scope ?? '--' }}</strong></section><section><span>原始字段</span><div class="field-tags"><code v-for="field in data?.meta.original_fields" :key="field">{{ field }}</code></div></section><p>所有漏斗节点均来自 Quick BI 搜索整体数据同一组件。相邻转化率只由同日相邻 UV 计算，不与 data_provider 的搜索或首页转化字段拼接。</p></div></el-drawer>
  </main>
</template>
