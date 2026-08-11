import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative base so the built assets work from a GitHub Pages project
  // subpath (https://<user>.github.io/<repo>/) as well as from "/".
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Sports Calendar",
        short_name: "Sports Cal",
        description: "Game times for Tottenham, Vikings, Lynx & F1 in Central Time",
        theme_color: "#132257",
        background_color: "#0b0b0f",
        display: "standalone",
        start_url: ".",
        scope: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Re-fetch games.json from the network first so the calendar stays
        // current; fall back to the cached copy when offline.
        runtimeCaching: [
          {
            urlPattern: /\/games\.json$/,
            handler: "NetworkFirst",
            options: { cacheName: "games-data" },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    host: true,
  },
});
