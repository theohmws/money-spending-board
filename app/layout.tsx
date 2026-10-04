import '@/styles/global.css';

import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Sans_Thai } from 'next/font/google';
import type { ReactNode } from 'react';

import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { AppConfig } from '@/utils/AppConfig';

const fontPlex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
});

const fontPlexThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-thai',
});

// Runs before first paint so the saved theme/palette doesn't flash.
const THEME_INIT = `try{var d=document.documentElement,m=localStorage.getItem('msb_theme'),p=localStorage.getItem('msb_palette');if(m==='dark')d.classList.add('dark');if(p&&p!=='edamame')d.setAttribute('data-palette',p)}catch(e){}`;

export const viewport: Viewport = {
  themeColor: '#FBFAF4',
};

export const metadata: Metadata = {
  title: AppConfig.title,
  description: AppConfig.description,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: AppConfig.title,
  },
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
  <html
    lang={AppConfig.locale}
    className={`${fontPlex.variable} ${fontPlexThai.variable}`}
    suppressHydrationWarning
  >
    <head>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
    </head>
    <body>
      <ServiceWorkerRegistration />
      {children}
    </body>
  </html>
);

export default RootLayout;
