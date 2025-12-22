import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => {
  return {
    name: "ActsOnWheels - Church Transportation Service",
    short_name: "ActsOnWheels",
    description:
      "Connecting church members with reliable transportation services for church events and services",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb", // blue-600 from your design
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    categories: ["transportation", "community", "religion"],
    shortcuts: [
      {
        name: "Request Pickup",
        short_name: "Request",
        description: "Request a ride to church",
        url: "/requests?action=new",
        icons: [{ src: "/icon-request.png", sizes: "96x96" }],
      },
      {
        name: "My Requests",
        short_name: "Requests",
        description: "View your pickup requests",
        url: "/requests",
        icons: [{ src: "/icon-history.png", sizes: "96x96" }],
      },
    ],
  };
};

export default manifest;
