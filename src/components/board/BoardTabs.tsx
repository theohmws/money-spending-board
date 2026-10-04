import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  't' | 'activeTab' | 'setActiveTab' | 'activeGraphTab' | 'setActiveGraphTab'
>;

export const BoardTabs = ({
  t,
  activeTab,
  setActiveTab,
  activeGraphTab,
  setActiveGraphTab,
}: Props) => (
  <div className="flex flex-col gap-2">
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as typeof activeTab)}
    >
      <TabsList variant="default">
        <TabsTrigger value="overview">{t.overviewTab}</TabsTrigger>
        <TabsTrigger value="graph">{t.graphTab}</TabsTrigger>
      </TabsList>
    </Tabs>

    {activeTab === 'graph' && (
      <Tabs
        value={activeGraphTab}
        onValueChange={(value) =>
          setActiveGraphTab(value as typeof activeGraphTab)
        }
      >
        <TabsList variant="default">
          <TabsTrigger value="trend">{t.trendTab}</TabsTrigger>
          <TabsTrigger value="compare">{t.compareTab}</TabsTrigger>
        </TabsList>
      </Tabs>
    )}
  </div>
);
