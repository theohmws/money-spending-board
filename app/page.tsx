import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';

import { BoardCard } from '@/components/board/BoardCard';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
  variable: '--font-manrope',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: '💰Money Spending',
  description: 'Money Spending Board.',
};

const Index = () => (
  <div className={`${manrope.variable} ${inter.variable} font-sans`}>
    <BoardCard />
  </div>
);

export default Index;
