import type { MetadataRoute } from 'next';

// FIXME: Change to the production URL
const SITE_URL = 'https://example.com';

export const dynamic = 'force-static';

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
  },
  sitemap: `${SITE_URL}/sitemap.xml`,
});

export default robots;
