import type { MetadataRoute } from "next";

/**
 * robots.txt.
 *
 * Everything public is crawlable; the point of this file is really the sitemap
 * pointer, which is how a crawler discovers a hundred and sixty stop pages
 * without following links from the homepage one at a time.
 *
 * The API routes are disallowed. They return JSON, they cost an
 * OpenRouteService request each, and there is nothing in them a search engine
 * should be indexing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://taketheoddway.com/sitemap.xml",
    host: "https://taketheoddway.com",
  };
}
