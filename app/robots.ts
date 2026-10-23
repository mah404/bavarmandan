import type { MetadataRoute } from "next";

const siteUrl = "https://www.bavarmandan.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // not pages for visitors: the dashboard, the data endpoints, the private catalog
      disallow: ["/admin", "/bavarmandan-control-110", "/api/", "/private-catalog"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
