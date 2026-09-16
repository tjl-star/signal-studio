<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from "vue";
import { InfoFilled, RefreshRight } from "@element-plus/icons-vue";

import { fetchOverview } from "../api/overview";
import { formatClientMetric, formatMetric, formatRelativeChange, type MetricKey } from "../domain/overview";
import type { OverviewPayload } from "../types";
import { useThemeStore } from "../stores/theme";

const OverviewTrendChart = defineAsyncComponent(() => import("../components/OverviewTrendChart.vue"));
const filters = ref({ startDate: "2026-09-09", endDate: "2026-09-15", client: "安卓" });
const data = ref<OverviewPayload | null>(null);
const loading = ref(false);
const error = ref("");
const sourceDrawer = ref(false);
const theme = useThemeStore();

const metrics: Array<{ key: MetricKey; label: string; description: string }> = [
  { key: "device_dau", label: "设备 DAU", description: "当日活跃设备数" },
  { key: "new_device", label: "新增设备", description: "当日新增设备数" },
  { key: "play_rate", label: "播放率", description: "后台原始播放率" },
  { key: "avg_watch_duration", label: "人均播放时长", description: "全部内容口径" },
  { key: "avg_play_count", label: "人均播放次数", description: "客户端日均值" }
];

async function loadOverview() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await fetchOverview(filters.value);
  } catch (reason) {
    error.value = "总览数据加载失败，请确认本地服务和数据导入状态。";
    console.error(reason);
  } finally {
    loading.value = false;
  }
}

const chartOption = computed(() => ({
  animationDuration: 240,
  color: [theme.current.primary, theme.current.secondary],
  tooltip: { trigger: "axis", backgroundColor: "#111827", borderWidth: 0, textStyle: { color: "#fff" } },
  legend: { right: 8, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: "#667085" } },
  grid: { left: 18, right: 18, top: 46, bottom: 10, containLabel: true },
  xAxis: {
    type: "category", boundaryGap: false,
    data: data.value?.trend.map((row) => row.date.slice(5)) ?? [],
    axisLine: { lineStyle: { color: "#dfe3e8" } }, axisTick: { show: false }, axisLabel: { color: "#7a8492" }
  },
  yAxis: {
    type: "value", axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: "#7a8492" },
    splitLine: { lineStyle: { color: "#eef1f4" } }
  },
  series: [
    {
      name: "设备 DAU", type: "line", smooth: 0.25, symbol: "circle", symbolSize: 6,
      lineStyle: { width: 2.5 }, areaStyle: { color: `${theme.current.primary}14` },
      data: data.value?.trend.map((row) => row.device_dau) ?? []
    },
    {
      name: "新增设备", type: "line", smooth: 0.25, symbol: "circle", symbolSize: 6,
      lineStyle: { width: 2.5 }, data: data.value?.trend.map((row) => row.new_device) ?? []
    }
  ]
}));

onMounted(loadOverview);
</script>

<template>
  <main class="main-content page-stack">
    <header class="page-intro">
      <div><h2>核心运营指标</h2><p>快速确认用户规模、播放质量和客户端表现。</p></div>
      <div class="page-intro-actions">
        <span class="page-date">数据范围 {{ filters.startDate }} 至 {{ filters.endDate }}</span>
        <button class="source-button" type="button" @click="sourceDrawer = true"><el-icon><InfoFilled /></el-icon>数据说明</button>
      </div>
    </header>

    <section class="filter-bar" aria-label="数据筛选">
      <label><span>开始日期</span><el-date-picker v-model="filters.startDate" type="date" value-format="YYYY-MM-DD" /></label>
      <label><span>结束日期</span><el-date-picker v-model="filters.endDate" type="date" value-format="YYYY-MM-DD" /></label>
      <label><span>客户端</span><el-select v-model="filters.client"><el-option v-for="client in ['安卓','iOS','M站','全部']" :key="client" :label="client" :value="client" /></el-select></label>
      <el-button type="primary" :loading="loading" @click="loadOverview"><el-icon><RefreshRight /></el-icon>更新视图</el-button>
      <div class="freshness"><span class="status-dot"></span><div><b>{{ data?.meta.data_status === 'snapshot' ? '本地快照' : '数据已更新' }}</b><small>截至 {{ filters.endDate }}</small></div></div>
    </section>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false"><el-button size="small" @click="loadOverview">重新加载</el-button></el-alert>

    <section v-loading="loading" class="metric-grid" aria-label="核心指标">
      <article v-for="metric in metrics" :key="metric.key" class="metric-item">
        <div class="metric-label"><span>{{ metric.label }}</span><small>{{ metric.description }}</small></div>
        <strong>{{ formatMetric(metric.key, data?.summary[metric.key]) }}</strong>
        <div :class="['metric-change', `is-${formatRelativeChange(data?.comparison[metric.key]).tone}`]">
          <span>{{ formatRelativeChange(data?.comparison[metric.key]).text }}</span><small>较前一日</small>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="panel trend-panel">
        <div class="panel-head"><div><h2>用户规模趋势</h2><p>设备DAU与新增设备按日变化</p></div><span>{{ filters.startDate }} 至 {{ filters.endDate }}</span></div>
        <Suspense v-if="data?.trend.length"><overview-trend-chart class="trend-chart" :option="chartOption" /><template #fallback><div class="chart-loading">图表加载中</div></template></Suspense>
        <div v-else-if="!loading" class="empty-state"><strong>当前筛选暂无数据</strong><span>请调整日期或客户端后重新查询。</span></div>
      </article>
      <article class="panel status-panel">
        <div class="panel-head"><div><h2>数据状态</h2><p>当前页面使用的数据范围与来源</p></div></div>
        <dl>
          <div><dt>查询客户端</dt><dd>{{ filters.client }}</dd></div><div><dt>有效数据日</dt><dd>{{ data?.trend.length ?? 0 }} 天</dd></div>
          <div><dt>主要数据源</dt><dd>{{ data?.meta.source ?? '--' }}</dd></div><div><dt>数据模式</dt><dd><span class="status-badge">SQLite 快照</span></dd></div>
        </dl>
        <button type="button" class="text-action" @click="sourceDrawer = true">查看字段与口径</button>
      </article>
    </section>

    <section class="panel client-detail-panel" aria-labelledby="client-detail-title">
      <div class="panel-head"><div><h2 id="client-detail-title">客户端明细</h2><p>设备 DAU、播放率与人均播放表现</p></div><span>{{ data?.meta.client_breakdown_scope ?? '安卓 / iOS / M站' }}</span></div>
      <div v-if="data?.client_breakdown.length" class="table-wrap">
        <table class="client-table"><thead><tr><th>客户端</th><th>数据日期</th><th>设备 DAU</th><th>播放率</th><th>人均播放时长</th><th>人均播放次数</th></tr></thead>
          <tbody><tr v-for="row in data.client_breakdown" :key="row.client" :class="{ 'is-selected': row.client === filters.client }">
            <td><strong>{{ row.client }}</strong><span v-if="row.client === filters.client">当前筛选</span></td><td>{{ row.date }}</td>
            <td>{{ formatClientMetric('device_dau', row.device_dau) }}</td><td>{{ formatClientMetric('play_rate', row.play_rate) }}</td>
            <td>{{ formatClientMetric('avg_watch_duration', row.avg_watch_duration) }}</td><td>{{ formatClientMetric('avg_play_count', row.avg_play_count) }}</td>
          </tr></tbody>
        </table>
      </div>
      <div v-else-if="!loading" class="table-empty">当前日期范围暂无客户端明细。</div>
    </section>

    <el-drawer v-model="sourceDrawer" title="数据来源与口径" size="420px">
      <div class="source-drawer">
        <section><span>数据源</span><strong>{{ data?.meta.source ?? '--' }}</strong></section><section><span>接口 / 组件</span><strong>{{ data?.meta.component ?? '--' }}</strong></section>
        <section><span>查询范围</span><strong>{{ filters.startDate }} 至 {{ filters.endDate }}</strong></section><section><span>客户端</span><strong>{{ filters.client }}</strong></section>
        <section><span>原始字段</span><div class="field-tags"><code v-for="field in data?.meta.original_fields" :key="field">{{ field }}</code></div></section>
        <p>设备DAU、新增设备和播放率来自 coreData；人均播放时长与人均播放次数分别保留对应接口的原始口径。本页面不使用相近字段补齐缺失值。</p>
      </div>
    </el-drawer>
  </main>
</template>
