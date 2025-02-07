import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
// Node 14 & 16
// import manifest from './manifest.json'
// Node >=17
import manifest from "./manifest.json" assert { type: "json" };

export default defineConfig({
	plugins: [crx({ manifest })],
});
