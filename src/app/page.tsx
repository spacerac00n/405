"use client";

import { useState } from "react";

import { ExploreTab } from "@/components/dashboard/ExploreTab";
import { ImproveTab } from "@/components/dashboard/ImproveTab";
import { UnderstandTab } from "@/components/dashboard/UnderstandTab";
import { TopBar } from "@/components/layout/TopBar";
import type { TourTab } from "@/components/layout/TabSwitcher";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useEnergyDashboard } from "@/lib/hooks/useEnergyDashboard";

export default function Home() {
  const dashboard = useEnergyDashboard();
  const [activeTab, setActiveTab] = useState<TourTab>("understand");

  return (
    <>
      <OnboardingModal
        open={dashboard.onboardingOpen}
        initialProfile={dashboard.profile}
        onComplete={dashboard.completeOnboarding}
        onDismiss={dashboard.dismissOnboarding}
      />
      <main className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(83,212,255,0.14),transparent_26%),radial-gradient(circle_at_top_right,rgba(255,125,140,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(139,231,143,0.12),transparent_24%)]" />
        <TopBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          datasetOrigin={dashboard.datasetOrigin}
          datasetLabel={dashboard.datasetLabel}
          csvError={dashboard.csvError}
          onFileSelect={dashboard.handleCsvUpload}
          onEditProfile={dashboard.reopenOnboarding}
        />
        <div className="relative mx-auto flex w-full max-w-[1480px] flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          {activeTab === "understand" ? (
            <UnderstandTab
              weeklySummary={dashboard.weeklySummary}
              allDays={dashboard.allDays}
              profile={dashboard.profile}
              selectedDay={dashboard.selectedDay}
              selectedSlot={dashboard.selectedSlot}
              selectedSpikes={dashboard.selectedSpikes}
              selectedSpike={dashboard.selectedSpike}
              applianceScores={dashboard.applianceScores}
              reasonFacts={dashboard.reasonFacts}
              actionTags={dashboard.actionTags}
              assistantLoading={dashboard.assistantLoading}
              assistantAnswer={dashboard.assistantAnswer}
              assistantError={dashboard.assistantError}
              assistantMode={dashboard.assistantMode}
              onSelectDay={dashboard.selectDay}
              onSelectSlot={dashboard.selectSlot}
              onRequestAssistant={dashboard.requestAssistant}
            />
          ) : null}

          {activeTab === "explore" ? (
            <ExploreTab
              impactMetrics={dashboard.impactMetrics}
            />
          ) : null}

          {activeTab === "improve" ? (
            <ImproveTab
              hasData={dashboard.hasData}
              challenges={dashboard.challenges}
              habitInsights={dashboard.habitInsights}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
