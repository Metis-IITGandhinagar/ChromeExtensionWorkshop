import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" assert { type: "json" };

export default defineConfig({
  plugins: [
    crx({
      manifest,
      build: {
        rollupOptions: {
          input: {
            popup: "popup.html",
            dialog: "dialog.html",
          },
          output: {
            // Add this to preserve CSS class names
            assetFileNames: "assets/[name].[ext]",
          },
        },
      },
    }),
  ],
});