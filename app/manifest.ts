import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MezoPay",
    short_name: "MezoPay",
    description: "Use Bitcoin like money. Spend in MUSD. Redeem anytime.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
    categories: ["finance", "payment", "cryptocurrency"],
  }
}

