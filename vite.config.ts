import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.test.ts", "**/*.test.tsx"],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "RasterSanityPlugin",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "sanity",
        "@sanity/ui",
        "@sanity/icons",
        "styled-components",
        "@raster-app/raster-toolkit",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          sanity: "Sanity",
          "@sanity/ui": "SanityUI",
          "@sanity/icons": "SanityIcons",
          "styled-components": "styled",
          "@raster-app/raster-toolkit": "RasterToolkit",
        },
      },
    },
  },
});
