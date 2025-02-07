// Import necessary functions from Vite and the CRX plugin
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
// Import the manifest file as JSON
import manifest from "./manifest.json" assert { type: "json" };

// Export the Vite configuration
export default defineConfig({
	// Array of plugins to use with Vite
	plugins: [
		// Use the crx plugin to build the Chrome extension
		crx({
			// Path to the manifest file
			manifest,
			// Build options
			build: {
				// Rollup options
				rollupOptions: {
					// Specify entry points for different HTML files
					input: {
						popup: "sidebar/sidebar.html",
						dialog: "dialog/dialog.html",
					},
					// Output options
					output: {
						// Add this to preserve CSS class names
						assetFileNames: "assets/[name].[ext]",
					},
				},
			},
		}),
	],
});