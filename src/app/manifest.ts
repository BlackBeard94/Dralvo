import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dralvo — Automated XAUUSD Gold Trading Robots",
    short_name: "Dralvo",
    description: "Automated gold (XAUUSD) trading robots for MetaTrader 5 — license keys, downloads and account tools.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080C",
    theme_color: "#D4A843",
    orientation: "portrait-primary",
    categories: ["finance", "business"],
    icons: [
      {
        src: "/brand/dralvo-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/dralvo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/dralvo-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
