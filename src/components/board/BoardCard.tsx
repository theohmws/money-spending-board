'use client';

import { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { AppConfig } from '@/utils/AppConfig';

import { AddTransactionModal } from './AddTransactionModal';
import { AuthScreen } from './AuthScreen';
import { BoardHeader } from './BoardHeader';
import { BoardTabs } from './BoardTabs';
import { BudgetSplit } from './BudgetSplit';
import { CategorySettingsModal } from './CategorySettingsModal';
import { CompareChart } from './CompareChart';
import { ImportPreviewModal } from './ImportPreviewModal';
import { ImportSettingsModal } from './ImportSettingsModal';
import { ProfileModal } from './ProfileModal';
import { RatioModal } from './RatioModal';
import { TransactionList } from './TransactionList';
import { TrendChart } from './TrendChart';

export const BoardCard = () => {
  const board = useSpendingBoard();
  const { isDesktop, themeTokens } = board;

  return (
    <div
      className="flex min-h-screen items-start justify-center"
      style={{
        padding: isDesktop ? '0' : '40px 16px',
        background: themeTokens.pageBg,
      }}
    >
      <div
        className="flex w-full max-w-full flex-col overflow-hidden"
        style={{
          width: isDesktop ? '100%' : '430px',
          background: themeTokens.cardBg,
          borderRadius: isDesktop ? '0' : '28px',
          boxShadow: isDesktop ? 'none' : '0 20px 60px rgba(20,30,25,0.10)',
          minHeight: isDesktop ? '100vh' : '780px',
        }}
      >
        <div
          className="mx-auto flex w-full flex-1 flex-col"
          style={{ maxWidth: isDesktop ? '960px' : '100%' }}
        >
          {!board.isOnline && (
            <div
              className="px-4 py-2.5 text-center text-[12.5px] font-semibold"
              style={{ background: '#FDF3E2', color: '#8A5A00' }}
            >
              {board.t.offlineBanner}
            </div>
          )}

          {board.booting && (
            <div
              className="flex flex-1 items-center justify-center text-sm"
              style={{ color: themeTokens.subtext2 }}
            >
              {board.t.loadingLabel}
            </div>
          )}

          {board.showConfigError && (
            <div
              className="flex flex-1 items-center justify-center px-8 text-center text-sm leading-relaxed"
              style={{ color: themeTokens.subtext2 }}
            >
              {board.t.configMissing}
            </div>
          )}

          {board.showLogin && (
            <AuthScreen
              t={board.t}
              lang={board.lang}
              toggleLang={board.toggleLang}
              authMode={board.authMode}
              authForm={board.authForm}
              onAuthEmailChange={board.onAuthEmailChange}
              onAuthPasswordChange={board.onAuthPasswordChange}
              authError={board.authError}
              authLoading={board.authLoading}
              submitAuth={board.submitAuth}
              oauthProviders={board.oauthProviders}
              signInWithOAuth={board.signInWithOAuth}
              toggleAuthMode={board.toggleAuthMode}
              themeTokens={themeTokens}
            />
          )}

          {board.showApp && (
            <div className="flex flex-1 flex-col">
              <BoardHeader
                t={board.t}
                lang={board.lang}
                toggleLang={board.toggleLang}
                openProfile={board.openProfile}
                headerAvatarBg={board.headerAvatarBg}
                headerAvatarInitial={board.headerAvatarInitial}
                userEmail={board.userEmail}
                signOut={board.signOut}
                selectedMonth={board.selectedMonth}
                monthOptions={board.monthOptions}
                onMonthChange={board.onMonthChange}
                balanceLabel={board.balanceLabel}
                incomeLabel={board.incomeLabel}
                expenseLabel={board.expenseLabel}
              />

              <div className="flex-1 overflow-y-auto px-6 pb-[100px] pt-5.5">
                <BoardTabs
                  t={board.t}
                  activeTab={board.activeTab}
                  setActiveTab={board.setActiveTab}
                  activeGraphTab={board.activeGraphTab}
                  setActiveGraphTab={board.setActiveGraphTab}
                  themeTokens={themeTokens}
                />

                {board.activeTab === 'overview' && (
                  <div className="mt-5.5">
                    <BudgetSplit
                      t={board.t}
                      showRuleInfo={board.showRuleInfo}
                      toggleRuleInfo={board.toggleRuleInfo}
                      openRatioModal={board.openRatioModal}
                      categoryCards={board.categoryCards}
                      themeTokens={themeTokens}
                    />
                    <TransactionList
                      t={board.t}
                      transactionRows={board.transactionRows}
                      transactionFilter={board.transactionFilter}
                      setTransactionFilter={board.setTransactionFilter}
                      badgeColors={board.badgeColors}
                      startImport={board.startImport}
                      deleteError={board.deleteError}
                      isOnline={board.isOnline}
                      themeTokens={themeTokens}
                    />
                  </div>
                )}

                {board.activeTab === 'graph' && (
                  <div className="mt-5.5">
                    {board.activeGraphTab === 'trend' && (
                      <TrendChart
                        t={board.t}
                        monthlyTotals={board.monthlyTotals}
                        trendMonthLimit={board.trendMonthLimit}
                        setTrendMonthLimit={board.setTrendMonthLimit}
                        trendSeries={board.trendSeries}
                        setTrendSeries={board.setTrendSeries}
                        themeTokens={themeTokens}
                      />
                    )}
                    {board.activeGraphTab === 'compare' && (
                      <CompareChart
                        t={board.t}
                        compareRows={board.compareRows}
                        themeTokens={themeTokens}
                      />
                    )}
                  </div>
                )}
              </div>

              {isDesktop && (
                <div
                  className="sticky bottom-0 px-6 pb-5.5 pt-4"
                  style={{ background: themeTokens.fadeToCard }}
                >
                  <button
                    type="button"
                    onClick={board.openAddModal}
                    disabled={!board.isOnline}
                    className="w-full rounded-2xl p-4 text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ background: '#132119', color: '#EFFCF4' }}
                  >
                    + {board.t.addTransaction}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {board.showApp && !isDesktop && (
          <button
            type="button"
            onClick={board.openAddModal}
            disabled={!board.isOnline}
            aria-label={board.t.addTransaction}
            className="fixed bottom-6 right-6 z-10 flex size-14 items-center justify-center rounded-full text-2xl font-bold disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: '#0E8F5F',
              color: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(14,143,95,0.45)',
            }}
          >
            +
          </button>
        )}

        {AppConfig.versionLabel && (
          <div
            className="px-6 pb-3 pt-1 text-center text-[10.5px]"
            style={{ color: themeTokens.subtext3 }}
          >
            {AppConfig.versionLabel}
          </div>
        )}
      </div>

      <AddTransactionModal
        t={board.t}
        showAddModal={board.showAddModal}
        editingTxId={board.editingTxId}
        closeAddModal={board.closeAddModal}
        txType={board.txType}
        setTxType={board.setTxType}
        txForm={board.txForm}
        onTxAmountChange={board.onTxAmountChange}
        onTxNoteChange={board.onTxNoteChange}
        onTxDateChange={board.onTxDateChange}
        categoryOptions={board.categoryOptions}
        saveTransaction={board.saveTransaction}
        saveError={board.saveError}
        isOnline={board.isOnline}
        themeTokens={themeTokens}
      />
      <RatioModal
        t={board.t}
        showRatioModal={board.showRatioModal}
        closeRatioModal={board.closeRatioModal}
        ratioRows={board.ratioRows}
        ratioSum={board.ratioSum}
        saveRatios={board.saveRatios}
        themeTokens={themeTokens}
      />
      <CategorySettingsModal
        t={board.t}
        showCategorySettings={board.showCategorySettings}
        closeCategorySettings={board.closeCategorySettings}
        categorySettingsRows={board.categorySettingsRows}
        saveCategoryMeta={board.saveCategoryMeta}
        themeTokens={themeTokens}
      />
      <ProfileModal
        t={board.t}
        showProfile={board.showProfile}
        closeProfile={board.closeProfile}
        profileForm={board.profileForm}
        onProfileNameChange={board.onProfileNameChange}
        onProfileIncomeChange={board.onProfileIncomeChange}
        avatarSwatches={board.avatarSwatches}
        headerAvatarInitial={board.headerAvatarInitial}
        saveProfile={board.saveProfile}
        editSplitFromProfile={board.editSplitFromProfile}
        openCategorySettings={board.openCategorySettings}
        openImportSettings={board.openImportSettings}
        profileRatioLabel={board.profileRatioLabel}
        userEmail={board.userEmail}
        theme={board.theme}
        setTheme={board.setTheme}
        themeTokens={themeTokens}
      />
      <ImportPreviewModal
        t={board.t}
        importStatus={board.importStatus}
        importPreviewRows={board.importPreviewRows}
        importParseError={board.importParseError}
        passwordIsRetry={board.passwordIsRetry}
        importError={board.importError}
        submitPassword={board.submitPassword}
        cancelImport={board.cancelImport}
        toggleRowIncluded={board.toggleRowIncluded}
        editRowDescription={board.editRowDescription}
        editRowCategory={board.editRowCategory}
        confirmImport={board.confirmImport}
        categoryChoices={board.categoryChoices}
        themeTokens={themeTokens}
      />
      <ImportSettingsModal
        t={board.t}
        showImportSettings={board.showImportSettings}
        closeImportSettings={board.closeImportSettings}
        ruleRows={board.ruleRows}
        newRuleKeyword={board.newRuleKeyword}
        onNewRuleKeywordChange={board.onNewRuleKeywordChange}
        newRuleCategory={board.newRuleCategory}
        onNewRuleCategoryChange={board.onNewRuleCategoryChange}
        addRule={board.addRule}
        ruleError={board.ruleError}
        categoryChoices={board.categoryChoices}
        badgeColorsForm={board.badgeColorsForm}
        selectBadgeColor={board.selectBadgeColor}
        saveBadgeColors={board.saveBadgeColors}
        badgeColorsError={board.badgeColorsError}
        themeTokens={themeTokens}
      />
    </div>
  );
};
