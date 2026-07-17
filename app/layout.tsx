import '@/styles/global.css';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppConfig } from '@/utils/AppConfig';

export const metadata: Metadata = {
  title: AppConfig.title,
  description: AppConfig.description,
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: AppConfig.title,
    description: AppConfig.description,
    locale: AppConfig.locale,
    siteName: AppConfig.site_name,
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang={AppConfig.locale}>
    <body>{children}</body>
  </html>
);

export default RootLayout;
