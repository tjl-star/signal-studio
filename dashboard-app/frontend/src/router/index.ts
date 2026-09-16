import { createRouter, createWebHashHistory } from "vue-router";

import OverviewPage from "../views/OverviewPage.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "overview", component: OverviewPage, meta: { title: "运营总览" } },
    { path: "/monthly-report", name: "monthly-report", component: () => import("../views/MonthlyReportPage.vue"), meta: { title: "运营月报" } },
    {
      path: "/content-rankings",
      name: "content-rankings",
      component: () => import("../views/ContentRankingPage.vue"),
      meta: { title: "内容榜单" }
    },
    {
      path: "/search-conversion",
      name: "search-conversion",
      component: () => import("../views/SearchConversionPage.vue"),
      meta: { title: "转化分析" }
    },
    {
      path: "/resource-placements",
      name: "resource-placements",
      component: () => import("../views/ResourcePlacementPage.vue"),
      meta: { title: "资源位运营" }
    },
    { path: "/home-operations", name: "home-operations", component: () => import("../views/HomeOperationsPage.vue"), meta: { title: "首页运营" } }
    ,{ path: "/search-rankings", name: "search-rankings", component: () => import("../views/SearchRankingPage.vue"), meta: { title: "热搜榜单" } }
    ,{ path: "/bl-consumption", name: "bl-consumption", component: () => import("../views/BlConsumptionPage.vue"), meta: { title: "BL 内容消费" } }
    ,{ path: "/genre-contribution", name: "genre-contribution", component: () => import("../views/GenreContributionPage.vue"), meta: { title: "剧种内容贡献" } }
    ,{ path: "/playback-growth", name: "playback-growth", component: () => import("../views/PlaybackGrowthPage.vue"), meta: { title: "播放增长榜" } }
  ]
});
