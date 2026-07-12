import type { MetadataRoute } from 'next';

// FIXME: Change to the production URL
const SITE_URL = 'https://example.com';

export const dynamic = 'force-static';

const sitemap = (): MetadataRoute.Sitemap => {
  const staticRoutes = ['', '/about', '/blog'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  const blogRoutes = [...Array(10)].map((_, index) => ({
    url: `${SITE_URL}/blog/blog-${index}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...blogRoutes];
};

export default sitemap;
