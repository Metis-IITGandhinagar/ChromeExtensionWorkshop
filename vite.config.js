import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" assert { type: "json" };

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				sidepanel: "sidepanel/index.html",
			},
		},
	},
  plugins: [
    crx({
      manifest,
      build: {
        rollupOptions: {
          input: {
            popup: "popup.html",
            dialog: "dialog.html",
          },
        },
      },
    }),
  ],
});
