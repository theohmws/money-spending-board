'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { usePublicStats } from '@/hooks/usePublicStats';
import { useSpendingBoard } from '@/hooks/useSpendingBoard';
import { AppConfig } from '@/utils/AppConfig';

import { AddTransactionModal } from './AddTransactionModal';
import { ApiTokensModal } from './ApiTokensModal';
import { AuthScreen } from './AuthScreen';
import { BoardHeader } from './BoardHeader';
import { BoardTabs } from './BoardTabs';
import { BudgetSplit } from './BudgetSplit';
import { CategorySettingsModal } from './CategorySettingsModal';
import { CompareChart } from './CompareChart';
import { ImportPreviewModal } from './ImportPreviewModal';
import { ImportSettingsModal } from './ImportSettingsModal';
import { LandingPage } from './LandingPage';
import { ProfileModal } from './ProfileModal';
import { RatioModal } from './RatioModal';
import { TransactionList } from './TransactionList';
import { TrendChart } from './TrendChart';

const HAS_LOGGED_IN_KEY = 'msb_has_logged_in';

export const BoardCard = () => {
  const board = useSpendingBoard();
  const { isDesktop, themeTokens } = board;
  const [showAuthForm, setShowAuthForm] = useState(false);
  const publicStats = usePublicStats(
    board.clientRef,
    board.showLogin && !showAuthForm
  );

  // The landing page is for visitors who have never signed in on this
  // browser; returning users go straight to the sign-in form.
  useEffect(() => {
    try {
      if (board.showApp) {
        localStorage.setItem(HAS_LOGGED_IN_KEY, '1');
      } else if (localStorage.getItem(HAS_LOGGED_IN_KEY)) {
        setShowAuthForm(true);
      }
    } catch {
      // storage unavailable — fall back to always showing the landing page
    }
  }, [board.showApp]);

  // Signing out sends the user back to the landing page, so forget that they
  // have logged in before. Cleared before signing out so the effect above
  // doesn't skip the landing page when the session goes away.
  const handleSignOut = () => {
    try {
      localStorage.removeItem(HAS_LOGGED_IN_KEY);
    } catch {
      // storage unavailable — nothing to clear
    }
    setShowAuthForm(false);
    return board.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
        {!board.isOnline && (
          <div
            role="status"
            className="bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground"
          >
            {board.t.offlineBanner}
          </div>
        )}

        {board.booting && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {board.t.loadingLabel}
          </div>
        )}

        {board.showConfigError && (
          <div className="flex flex-1 items-center justify-center px-8 text-center text-sm leading-relaxed text-muted-foreground">
            {board.t.configMissing}
          </div>
        )}

        {board.showLogin && !showAuthForm && (
          <LandingPage
            t={board.t}
            lang={board.lang}
            toggleLang={board.toggleLang}
            stats={publicStats}
            onGetStarted={() => {
              if (board.authMode === 'signin') board.toggleAuthMode();
              setShowAuthForm(true);
            }}
            onSignIn={() => {
              if (board.authMode === 'signup') board.toggleAuthMode();
              setShowAuthForm(true);
            }}
          />
        )}

        {board.showLogin && showAuthForm && (
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
              signOut={handleSignOut}
              selectedMonth={board.selectedMonth}
              monthOptions={board.monthOptions}
              onMonthChange={board.onMonthChange}
              balanceLabel={board.balanceLabel}
              incomeLabel={board.incomeLabel}
              expenseLabel={board.expenseLabel}
              transferLabel={board.transferLabel}
            />

            <main className="flex flex-1 flex-col gap-5 px-4 pb-28 pt-5 sm:px-6">
              <BoardTabs
                t={board.t}
                activeTab={board.activeTab}
                setActiveTab={board.setActiveTab}
                activeGraphTab={board.activeGraphTab}
                setActiveGraphTab={board.setActiveGraphTab}
              />

              {board.activeTab === 'overview' && (
                <>
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
                </>
              )}

              {board.activeTab === 'graph' && (
                <>
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
                </>
              )}
            </main>

            {isDesktop && (
              <div className="sticky bottom-0 bg-gradient-to-b from-transparent to-background to-30% px-6 pb-5 pt-4">
                <Button
                  size="lg"
                  onClick={board.openAddModal}
                  disabled={!board.isOnline}
                  className="w-full"
                >
                  <Plus />
                  {board.t.addTransaction}
                </Button>
              </div>
            )}
          </div>
        )}

        {board.showApp && !isDesktop && (
          <Button
            size="icon-lg"
            onClick={board.openAddModal}
            disabled={!board.isOnline}
            aria-label={board.t.addTransaction}
            className="fixed bottom-6 right-6 z-10 size-12 rounded-full shadow-md"
          >
            <Plus className="size-5" />
          </Button>
        )}

        {AppConfig.versionLabel && (
          <div className="px-6 pb-3 pt-1 text-center text-xs text-muted-foreground">
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
      />
      <RatioModal
        t={board.t}
        showRatioModal={board.showRatioModal}
        closeRatioModal={board.closeRatioModal}
        ratioRows={board.ratioRows}
        ratioSum={board.ratioSum}
        saveRatios={board.saveRatios}
        ratiosSaveError={board.ratiosSaveError}
      />
      <CategorySettingsModal
        t={board.t}
        showCategorySettings={board.showCategorySettings}
        closeCategorySettings={board.closeCategorySettings}
        categorySettingsRows={board.categorySettingsRows}
        saveCategoryMeta={board.saveCategoryMeta}
        categoryMetaSaveError={board.categoryMetaSaveError}
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
        profileSaveError={board.profileSaveError}
        editSplitFromProfile={board.editSplitFromProfile}
        openCategorySettings={board.openCategorySettings}
        openImportSettings={board.openImportSettings}
        openApiTokens={board.openApiTokens}
        profileRatioLabel={board.profileRatioLabel}
        userEmail={board.userEmail}
        theme={board.theme}
        setTheme={board.setTheme}
        palette={board.palette}
        setPalette={board.setPalette}
      />
      <ImportPreviewModal
        t={board.t}
        importStatus={board.importStatus}
        importSourceChoices={board.importSourceChoices}
        selectImportFile={board.selectImportFile}
        importPreviewRows={board.importPreviewRows}
        importParseError={board.importParseError}
        importParseErrorDetail={board.importParseErrorDetail}
        passwordIsRetry={board.passwordIsRetry}
        importError={board.importError}
        submitPassword={board.submitPassword}
        cancelImport={board.cancelImport}
        toggleRowIncluded={board.toggleRowIncluded}
        editRowDescription={board.editRowDescription}
        editRowCategory={board.editRowCategory}
        confirmImport={board.confirmImport}
        categoryChoices={board.categoryChoices}
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
        ownNamesForm={board.ownNamesForm}
        onOwnNamesFormChange={board.onOwnNamesFormChange}
        selectBadgeColor={board.selectBadgeColor}
        saveBadgeColors={board.saveBadgeColors}
        badgeColorsError={board.badgeColorsError}
      />
      <ApiTokensModal
        t={board.t}
        showApiTokens={board.showApiTokens}
        closeApiTokens={board.closeApiTokens}
        apiTokenRows={board.apiTokenRows}
        newTokenName={board.newTokenName}
        onNewTokenNameChange={board.onNewTokenNameChange}
        createApiToken={board.createApiToken}
        creatingToken={board.creatingToken}
        revealedToken={board.revealedToken}
        dismissRevealedToken={board.dismissRevealedToken}
        apiTokenError={board.apiTokenError}
        shortcutEndpoint={board.shortcutEndpoint}
        isOnline={board.isOnline}
      />
    </div>
  );
};
