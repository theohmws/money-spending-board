import type { useSpendingBoard } from '@/hooks/useSpendingBoard';

type Props = Pick<
  ReturnType<typeof useSpendingBoard>,
  | 't'
  | 'activeTab'
  | 'setActiveTab'
  | 'activeGraphTab'
  | 'setActiveGraphTab'
  | 'themeTokens'
>;

export const BoardTabs = ({
  t,
  activeTab,
  setActiveTab,
  activeGraphTab,
  setActiveGraphTab,
  themeTokens,
}: Props) => (
  <div>
    <div
      className="flex gap-2 rounded-[11px] p-1"
      style={{ background: themeTokens.chipBg }}
    >
      <button
        type="button"
        onClick={() => setActiveTab('overview')}
        className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
        style={{
          background: activeTab === 'overview' ? '#132119' : 'transparent',
          color: activeTab === 'overview' ? '#EFFCF4' : themeTokens.label,
        }}
      >
        {t.overviewTab}
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('graph')}
        className="flex-1 rounded-lg p-2.5 text-[13.5px] font-semibold"
        style={{
          background: activeTab === 'graph' ? '#132119' : 'transparent',
          color: activeTab === 'graph' ? '#EFFCF4' : themeTokens.label,
        }}
      >
        {t.graphTab}
      </button>
    </div>

    {activeTab === 'graph' && (
      <div
        className="mt-2.5 flex gap-2 rounded-[11px] p-1"
        style={{ background: themeTokens.chipBg }}
      >
        <button
          type="button"
          onClick={() => setActiveGraphTab('trend')}
          className="flex-1 rounded-lg p-2 text-[12.5px] font-semibold"
          style={{
            background:
              activeGraphTab === 'trend' ? themeTokens.cardBg : 'transparent',
            color:
              activeGraphTab === 'trend'
                ? themeTokens.text
                : themeTokens.subtext2,
          }}
        >
          {t.trendTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveGraphTab('compare')}
          className="flex-1 rounded-lg p-2 text-[12.5px] font-semibold"
          style={{
            background:
              activeGraphTab === 'compare' ? themeTokens.cardBg : 'transparent',
            color:
              activeGraphTab === 'compare'
                ? themeTokens.text
                : themeTokens.subtext2,
          }}
        >
          {t.compareTab}
        </button>
      </div>
    )}
  </div>
);
