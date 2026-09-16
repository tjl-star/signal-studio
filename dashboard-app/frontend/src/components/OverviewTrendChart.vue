<script setup lang="ts">
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

defineProps<{ option: Record<string, unknown> }>();

use([CanvasRenderer, LineChart, GridComponent, LegendComponent, TooltipComponent]);
</script>

<template>
  <v-chart :option="option" autoresize />
</template>
