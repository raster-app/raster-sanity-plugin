import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      insertTypesEntry: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "RasterSanityPlugin",
      fileName: (format) => (format === "cjs" ? "index.cjs" : "index.js"),
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "sanity",
        "styled-components",
        "@sanity/ui",
        "@raster/sdk",
        "@raster/react",
      ],
      output: [
        {
          format: "es",
          exports: "named",
        },
        {
          format: "cjs",
          exports: "named",
        },
      ],
    },
    sourcemap: true,
    minify: false,
  },
});
