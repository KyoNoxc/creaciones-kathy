/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // App instalable que funciona sin internet: el service worker guarda todos los archivos de la app
    // (incluidas las fuentes y el logo) la primera vez que se abre.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "Creaciones Kathy · Reportes de taller",
        short_name: "Creaciones Kathy",
        description: "Fichas de medidas, cálculo de tela y reportes para imprimir.",
        lang: "es-MX",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FBF5F7",
        theme_color: "#D23A72",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  preview: {
    // Puerto fijo: las fichas se guardan por dirección, así que la app instalada siempre usa la misma.
    port: 4173,
    strictPort: true,
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
