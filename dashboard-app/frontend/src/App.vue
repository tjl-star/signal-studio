<script setup lang="ts">
import { computed, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowDown, ArrowUp, Check, DataAnalysis, Document, House, InfoFilled, Monitor, Search, TrendCharts } from "@element-plus/icons-vue";
import { useThemeStore } from "./stores/theme";
import type { ThemeName } from "./utils/theme";

const route = useRoute();
const router = useRouter();
const theme = useThemeStore();
theme.initialize();
const title = computed(() => String(route.meta.title ?? "Signal Studio"));
function selectTheme(name: ThemeName) { theme.apply(name); }
type NavigationGroup = "dashboard" | "content" | "operations";
const expanded = reactive<Record<NavigationGroup, boolean>>({ dashboard: true, content: true, operations: true });
function toggleGroup(group: NavigationGroup) { expanded[group] = !expanded[group]; }
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">S</span><div><strong>运营数据平台</strong></div></div>
      <nav class="navigation" aria-label="主导航">
        <section class="nav-group">
          <button class="nav-group-title" :aria-expanded="expanded.dashboard" @click="toggleGroup('dashboard')"><el-icon><Monitor /></el-icon><strong>核心看板</strong><el-icon class="nav-chevron"><ArrowUp v-if="expanded.dashboard"/><ArrowDown v-else/></el-icon></button>
          <div v-show="expanded.dashboard" class="nav-group-items"><button class="nav-item nav-child" :class="{ 'is-active': route.name === 'overview' }" @click="router.push('/')"><span>运营总览</span></button><button class="nav-item nav-child" :class="{ 'is-active': route.name === 'monthly-report' }" @click="router.push('/monthly-report')"><span>运营月报</span></button></div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" :aria-expanded="expanded.content" @click="toggleGroup('content')"><el-icon><DataAnalysis /></el-icon><strong>用户与内容</strong><el-icon class="nav-chevron"><ArrowUp v-if="expanded.content"/><ArrowDown v-else/></el-icon></button>
          <div v-show="expanded.content" class="nav-group-items">
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'search-conversion' }" @click="router.push('/search-conversion')"><span>搜索转化</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'content-rankings' }" @click="router.push('/content-rankings')"><span>内容榜单</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'search-rankings' }" @click="router.push('/search-rankings')"><span>热搜榜单</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'bl-consumption' }" @click="router.push('/bl-consumption')"><span>BL 内容消费</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'genre-contribution' }" @click="router.push('/genre-contribution')"><span>剧种内容贡献</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'playback-growth' }" @click="router.push('/playback-growth')"><span>播放增长榜</span></button>
          </div>
        </section>
        <section class="nav-group">
          <button class="nav-group-title" :aria-expanded="expanded.operations" @click="toggleGroup('operations')"><el-icon><House /></el-icon><strong>运营阵地</strong><el-icon class="nav-chevron"><ArrowUp v-if="expanded.operations"/><ArrowDown v-else/></el-icon></button>
          <div v-show="expanded.operations" class="nav-group-items">
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'home-operations' }" @click="router.push('/home-operations')"><span>首页运营</span></button>
            <button class="nav-item nav-child" :class="{ 'is-active': route.name === 'resource-placements' }" @click="router.push('/resource-placements')"><span>资源位运营</span></button>
          </div>
        </section>
      </nav>
      <div class="sidebar-foot"><span class="status-dot"></span><div><strong>本地数据服务</strong><small>SQLite · FastAPI</small></div></div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <h1>{{ title }}</h1>
        <div class="top-actions">
          <div class="request-status"><el-icon><InfoFilled /></el-icon><span>数据服务正常</span></div>
          <el-dropdown trigger="click" @command="selectTheme">
            <button class="theme-button" aria-label="选择网页色调"><span class="theme-swatch" :style="{ background: theme.current.primary }"></span><span>{{ theme.current.label }}</span><el-icon><ArrowDown /></el-icon></button>
            <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="option in theme.options" :key="option.name" :command="option.name" :class="{ 'is-selected-theme': option.name === theme.name }"><span class="theme-option-swatch" :style="{ background: option.primary }"></span>{{ option.label }}<el-icon v-if="option.name === theme.name"><Check /></el-icon></el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </header>
      <router-view :key="theme.name" />
    </section>
  </div>
</template>
