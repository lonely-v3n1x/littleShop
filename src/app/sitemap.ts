import type { MetadataRoute } from "next";

// Add the checkout deep link to the index only if it ever becomes an indexable
// page; today it is excluded by robots and is not included here on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://littleshop.gh";
  return [
    {
      url: base + "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
