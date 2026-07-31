import type { MetadataRoute } from 'next';

import { AppConfig } from '@/utils/AppConfig';

export const dynamic = 'force-static';

const manifest = (): MetadataRoute.Manifest => ({
  name: AppConfig.title,
  short_name: AppConfig.site_name,
  description: AppConfig.description,
  start_url: '/',
  display: 'standalone',
  background_color: '#EEF1F0',
  theme_color: '#0E8F5F',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: '/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
});

export default manifest;
