<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { InfoFilled, RefreshRight } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { useThemeStore } from "../stores/theme";

import {
  fetchContentRankings,
  type ContentListType,
  type ContentRankingPayload,
  type ContentSort,
  type SortDirection
} from "../api/contentRanking";

const ContentRankingChart = defineAsyncComponent(() => import("../components/ContentRankingChart.vue"));
const route = useRoute();
const router = useRouter();
const theme = useThemeStore();
const queryListType = route.query.list_type;
const querySort = route.query.sort;
const queryDirection = route.query.direction;
const filters = reactive({
  date: typeof route.query.date === "string" ? route.query.date : "2026-09-15",
  listType: (queryListType === "新用户榜" ? queryListType : "总榜") as ContentListType,
  page: typeof route.query.page === "string" && Number(route.query.page) > 0 ? Number(route.query.page) : 1,
  pageSize: 15,
  sort: (["rank", "play_vv", "day_change"].includes(String(querySort)) ? querySort : "rank") as ContentSort,
  direction: (queryDirection === "desc" ? queryDirection : "asc") as SortDirection
});
const data = ref<ContentRankingPayload | null>(null);
const loading = ref(false);
const error = ref("");
const sourceDrawer = ref(false);
const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatNumber(value: number | null): string {
  return value === null ? "--" : numberFormatter.format(value);
}

function syncUrl() {
  router.replace({
    query: {
      date: filters.date,
      list_type: filters.listType,
      page: String(filters.page),
      sort: filters.sort,
      direction: filters.direction
    }
  });
}

async function loadRankings() {
  loading.value = true;
  error.value = "";
  syncUrl();
  try {
    data.value = await fetchContentRankings(filters);
  } catch (reason) {
    error.value = "内容榜单加载失败，请确认榜单快照已经导入。";
    console.error(reason);
  } finally {
    loading.value = false;
  }
}

function changeListType(value: ContentListType) {
  filters.listType = value;
  filters.page = 1;
  loadRankings();
}

function changeSort(value: ContentSort) {
  if (filters.sort === value) filters.direction = filters.direction === "asc" ? "desc" : "asc";
  else {
    filters.sort = value;
    filters.direction = value === "rank" ? "asc" : "desc";
  }
  filters.page = 1;
  loadRankings();
}

function changePage(page: number) {
  filters.page = page;
  loadRankings();
}

const chartOption = computed(() => ({
  animationDuration: 220,
  color: [theme.current.primary],
  grid: { left: 118, right: 28, top: 12, bottom: 24 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => numberFormatter.format(value) },
  xAxis: { type: "value", axisLabel: { color: "#7a8492" }, splitLine: { lineStyle: { color: "#eef1f4" } } },
  yAxis: {
    type: "category",
    data: (data.value?.top10 ?? []).slice().reverse().map((item) => item.title.length > 10 ? `${item.title.slice(0, 10)}…` : item.title),
    axisLabel: { color: "#5c6370" }, axisTick: { show: false }, axisLine: { show: false }
  },
  series: [{ type: "bar", barMaxWidth: 18, data: (data.value?.top10 ?? []).slice().reverse().map((item) => item.play_vv ?? 0), itemStyle: { borderRadius: [0, 4, 4, 0] } }]
}));

onMounted(loadRankings);
</script>

<template>
  <main class="main-content page-stack content-ranking-page">
    <header class="page-intro">
      <div><h2>站内播放排名 Top30</h2><p>按原始榜单字段查看内容播放表现，不合并同名内容。</p></div>
      <div class="page-intro-actions"><span class="page-date">数据日期 {{ filters.date }}</span><button class="source-button" @click="sourceDrawer = true"><el-icon><InfoFilled /></el-icon>数据说明</button></div>
    </header>

    <section class="filter-bar ranking-filter" aria-label="内容榜单筛选">
      <label><span>数据日期</span><el-date-picker v-model="filters.date" type="date" value-format="YYYY-MM-DD" /></label>
      <div class="ranking-tabs" role="tablist" aria-label="榜单类型">
        <button v-for="value in (['总榜','新用户榜'] as ContentListType[])" :key="value" :class="{ active: filters.listType === value }" role="tab" :aria-selected="filters.listType === value" @click="changeListType(value)">{{ value }}</button>
      </div>
      <el-button type="primary" :loading="loading" @click="loadRankings"><el-icon><RefreshRight /></el-icon>更新榜单</el-button>
      <div class="freshness"><span class="status-dot"></span><div><b>真实 Top30</b><small>{{ data?.meta.component ?? '--' }}</small></div></div>
    </section>

    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false"><el-button size="small" @click="loadRankings">重新加载</el-button></el-alert>

    <section class="ranking-summary-grid">
      <article class="metric-item"><div class="metric-label"><span>榜单记录</span><small>当前日期与榜单类型</small></div><strong>{{ data?.pagination.total ?? 0 }} 条</strong></article>
      <article class="metric-item"><div class="metric-label"><span>最高播放 VV</span><small>原始播放次数</small></div><strong>{{ formatNumber(data?.top10[0]?.play_vv ?? null) }}</strong></article>
      <article class="metric-item"><div class="metric-label"><span>播放 UV 状态</span><small>缺失时保留 --</small></div><strong>{{ data?.items.filter(item => item.play_uv === null).length ?? 0 }} 条缺失</strong></article>
      <article class="metric-item"><div class="metric-label"><span>数据状态</span><small>来源快照状态</small></div><strong class="ranking-status-value">{{ data?.meta.data_status === 'snapshot' ? '本地快照' : '--' }}</strong></article>
    </section>

    <section class="content-grid ranking-insights">
      <article class="panel">
        <div class="panel-head"><div><h2>播放 VV Top10</h2><p>按原始播放 VV 排序</p></div><span>{{ filters.listType }}</span></div>
        <Suspense v-if="data?.top10.length"><content-ranking-chart class="ranking-chart" :option="chartOption" /><template #fallback><div class="chart-loading">图表加载中</div></template></Suspense>
        <div v-else-if="!loading" class="empty-state"><strong>当前日期暂无榜单</strong><span>请选择有数据的日期。</span></div>
      </article>
      <article class="panel ranking-note">
        <div class="panel-head"><div><h2>榜单数据说明</h2><p>原始文件状态与能力边界</p></div></div>
        <dl><div><dt>榜单范围</dt><dd>仅展示真实 Top30</dd></div><div><dt>播放 UV</dt><dd>缺失时保留 --</dd></div><div><dt>排名</dt><dd>使用原始排名</dd></div><div><dt>新用户榜</dt><dd>来自 playTop10</dd></div><div><dt>新增用户榜</dt><dd>未接入独立接口</dd></div></dl>
      </article>
    </section>

    <section class="panel ranking-detail-panel">
      <div class="panel-head ranking-table-head">
        <div><h2>热播榜单明细</h2><p>服务端分页，保留 season_id 对应的原始记录</p></div>
        <div class="ranking-sort"><span>排序</span><button :class="{ active: filters.sort === 'rank' }" @click="changeSort('rank')">排名</button><button :class="{ active: filters.sort === 'play_vv' }" @click="changeSort('play_vv')">播放 VV</button><button :class="{ active: filters.sort === 'day_change' }" @click="changeSort('day_change')">昨日环比</button></div>
      </div>
      <div v-loading="loading" class="table-wrap ranking-table-wrap">
        <table class="client-table ranking-table"><thead><tr><th>排名</th><th>内容名称</th><th>播放 UV</th><th>播放 VV</th><th>昨日环比</th><th>周环比</th><th>聚集类型</th><th>内容分类</th><th>题材标签</th><th>榜单状态</th><th>数据状态</th></tr></thead>
          <tbody><tr v-for="item in data?.items" :key="`${item.date}-${item.list_type}-${item.rank}`">
            <td><span class="rank-badge">{{ item.rank }}</span></td><td class="ranking-title"><strong>{{ item.title }}</strong><small>{{ item.season_id ? `ID ${item.season_id}` : '--' }}</small></td>
            <td>{{ formatNumber(item.play_uv) }}</td><td>{{ formatNumber(item.play_vv) }}</td><td :class="{ 'change-up': (item.day_change_rate ?? 0) > 0, 'change-down': (item.day_change_rate ?? 0) < 0 }">{{ item.day_change_text }}</td>
            <td :class="{ 'change-up': (item.week_change_rate ?? 0) > 0, 'change-down': (item.week_change_rate ?? 0) < 0 }">{{ item.week_change_text }}</td><td>{{ item.collection_type ?? '--' }}</td><td>{{ item.content_category ?? '--' }}</td><td class="genre-cell">{{ item.genre_tags ?? '--' }}</td><td>{{ item.ranking_status ?? '--' }}</td><td><span class="status-badge">{{ item.data_status }}</span></td>
          </tr></tbody>
        </table>
        <div v-if="!loading && !data?.items.length" class="table-empty">当前筛选暂无真实榜单记录。</div>
      </div>
      <div class="table-footer"><el-pagination background layout="prev, pager, next, total" :current-page="filters.page" :page-size="filters.pageSize" :total="data?.pagination.total ?? 0" @current-change="changePage" /></div>
    </section>

    <el-drawer v-model="sourceDrawer" title="内容榜单来源与口径" size="440px"><div class="source-drawer">
      <section><span>数据源</span><strong>{{ data?.meta.source ?? '--' }}</strong></section><section><span>接口 / 组件</span><strong>{{ data?.meta.component ?? '--' }}</strong></section>
      <section><span>查询条件</span><strong>{{ filters.date }} / {{ filters.listType }}</strong></section><section><span>原始字段</span><div class="field-tags"><code v-for="field in data?.meta.original_fields" :key="field">{{ field }}</code></div></section>
      <p>总榜来自 seasonPlayVV，“新用户榜”来自 playTop10，两套口径不混算；旧页面所称“新增用户榜”没有独立真实接口，继续标记为未接入。排名及环比均保留快照原始结果。</p>
    </div></el-drawer>
  </main>
</template>
