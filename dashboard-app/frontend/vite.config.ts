import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    vue(),
    Components({
      dts: "src/components.d.ts",
      resolvers: [ElementPlusResolver()]
    })
  ],
  server: {
    port: 5175,
    proxy: {
      "/api": "http://127.0.0.1:8765"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replace(/\\/g, "/");
          if (moduleId.includes("/node_modules/zrender/")) return "zrender";
          if (moduleId.includes("/node_modules/echarts/")) return "echarts";
          if (
            moduleId.includes("/node_modules/vue/") ||
            moduleId.includes("/node_modules/@vue/")
          ) return "vue-vendor";
        }
      }
    }
  }
});
