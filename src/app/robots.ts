import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Price list moves with the Jehucal catalogue, so crawlers get the home page
  // fresh by default — no crawl-rate caps.
  return {
    rules: {
      allow: ["/"],
      disallow: ["/api/"],
    },
  };
}
