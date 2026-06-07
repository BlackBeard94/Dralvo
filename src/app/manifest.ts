import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dralvo",
    short_name: "Dralvo",
    description: "XAUUSD analysis SaaS for gold-specific market context.",
    start_url: "/",
    display: "standalone",
    background_color: "#08080C",
    theme_color: "#D4A843",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
