import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [tailwindcss(), solid()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:40991/",
        changeOrigin: true,
        rewrite: (path) => path.replace("/api", ""),
      },
    },
  },
});
