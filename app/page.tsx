import type { Metadata } from 'next';

import { BoardCard } from '@/components/board/BoardCard';

export const metadata: Metadata = {
  title: 'Money Spending',
  description: 'Money Spending Board.',
};

const Index = () => <BoardCard />;

export default Index;
