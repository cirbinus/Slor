import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // ...
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
      ],
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
      ],
    }),
  ],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000/', // Flask 服务器地址
        changeOrigin: true,
      },
    },
  },
});
