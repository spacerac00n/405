"use client";

import { useState } from "react";

import type { DayEnergySeries, EnergySlot, SpikeDetection, WeeklySummaryItem } from "@/types/energy";
import type { ApplianceScore, AssistantMode } from "@/types/insights";
import type { OnboardingProfile } from "@/types/onboarding";

import { DayDropdown } from "@/components/dashboard/DayDropdown";
import { HeatTimelineSlider } from "@/components/dashboard/HeatTimelineSlider";
import { InsightAssistant } from "@/components/dashboard/InsightAssistant";
import { MonthlyUsageChart } from "@/components/dashboard/MonthlyUsageChart";
import { OrbitVisualization } from "@/components/dashboard/OrbitVisualization";
import { applianceProfiles } from "@/lib/config/applianceProfiles";
import { impactConfig } from "@/lib/config/impactConfig";
import { computeMonthlyBreakdown } from "@/lib/energy/computeMonthlyBreakdown";
import { type ApplianceBar, VISUAL_APPLIANCES } from "@/lib/energy/buildApplianceBars";
import { cn } from "@/lib/utils";

type UnderstandTabProps = {
  weeklySummary: WeeklySummaryItem[];
  allDays: DayEnergySeries[];
  profile: OnboardingProfile;
  selectedDay: DayEnergySeries | null;
  selectedSlot: EnergySlot | null;
  selectedSpikes: SpikeDetection[];
  selectedSpike: SpikeDetection | null;
  applianceScores: ApplianceScore[];
  reasonFacts: string[];
  actionTags: string[];
  assistantLoading: boolean;
  assistantAnswer: string | null;
  assistantError: string | null;
  assistantMode: AssistantMode | null;
  onSelectDay: (dayKey: string) => void;
  onSelectSlot: (timestamp: string) => void;
  onRequestAssistant: (mode: AssistantMode) => Promise<void>;
};

export function UnderstandTab({
  weeklySummary,
  allDays,
  profile,
  selectedDay,
  selectedSlot,
  selectedSpikes,
  selectedSpike,
  applianceScores,
  reasonFacts,
  actionTags,
  assistantLoading,
  assistantAnswer,
  assistantError,
  assistantMode,
  onSelectDay,
  onSelectSlot,
  onRequestAssistant,
}: UnderstandTabProps) {
  const [chartView, setChartView] = useState<"daily" | "monthly">("daily");

  // Active month for Monthly mode — lifted here so the orbit panel and the
  // month-pill selector in MonthlyUsageChart share the same source of truth.
  // null means "not yet explicitly chosen by the user"; we fall back to the
  // month of the currently selected day or the last available month.
  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(null);

  const fallbackMonthKey =
    selectedDay?.dayKey.slice(0, 7) ??
    (weeklySummary.length > 0
      ? weeklySummary[weeklySummary.length - 1].dayKey.slice(0, 7)
      : null);
  const effectiveMonthKey = activeMonthKey ?? fallbackMonthKey;
  // ── Monthly orbit bars ─────────────────────────────────────────────────
  // When Monthly mode is active, compute aggregated appliance bars for the
  // explicitly selected month (effectiveMonthKey) and pass them to
  // OrbitVisualization so the panel always matches the month-pill choice.
  const monthlyOrbitBars: ApplianceBar[] | undefined = (() => {
    if (chartView !== "monthly" || !effectiveMonthKey) return undefined;

    const monthDays = weeklySummary.filter(
      (d) => d.dayKey.slice(0, 7) === effectiveMonthKey,
    );
    if (!monthDays.length) return undefined;

    const breakdown = computeMonthlyBreakdown(monthDays, allDays, profile);
    const { monthlyTotal } = breakdown;
    if (monthlyTotal <= 0) return undefined;

    const billingRate = impactConfig.billingRatePerKwh ?? 0.3;
    const rows: Array<{ key: (typeof VISUAL_APPLIANCES)[number]; kwh: number }> = [
      { key: "cooling", kwh: breakdown.coolingKwh },
      { key: "heater",  kwh: breakdown.heaterKwh  },
      { key: "laundry", kwh: breakdown.laundryKwh },
    ];

    return rows
      .map(({ key, kwh }) => {
        const ap = applianceProfiles[key];
        return {
          appliance: key,
          label: ap.label,
          shortLabel: ap.shortLabel,
          icon: ap.icon,
          score: 0,
          energyShare: kwh / monthlyTotal,
          estimatedKwh: kwh,
          estimatedCost: kwh * billingRate,
        } satisfies ApplianceBar;
      })
      .sort((a, b) => b.energyShare - a.energyShare);
  })();

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
            Understand
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Understand your household spike
          </h1>
        </div>
        <OrbitVisualization
          slot={selectedSlot}
          scores={applianceScores}
          size="hero"
          overrideBars={monthlyOrbitBars}
        />
        {/* ── Chart view toggle ──────────────────── */}
        <div className="flex items-center gap-2">
          {(["daily", "monthly"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setChartView(view)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium capitalize transition-colors",
                chartView === view
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200",
              )}
            >
              {view}
            </button>
          ))}
        </div>
        {chartView === "daily" ? (
          <HeatTimelineSlider
            slots={selectedDay?.slots ?? []}
            selectedSlotTimestamp={selectedSlot?.timestamp ?? null}
            spikes={selectedSpikes}
            onSelect={onSelectSlot}
          />
        ) : (
          <MonthlyUsageChart
            items={weeklySummary}
            selectedDayKey={selectedDay?.dayKey ?? null}
            activeMonthKey={effectiveMonthKey}
            onMonthChange={setActiveMonthKey}
            onSelectDay={(dayKey) => {
              onSelectDay(dayKey);
              setChartView("daily");
            }}
          />
        )}
      </section>
      <div className="space-y-4 xl:sticky xl:top-24">
        <DayDropdown
          items={weeklySummary}
          selectedDayKey={selectedDay?.dayKey ?? null}
          onSelect={onSelectDay}
        />
        <InsightAssistant
          selectedSlot={selectedSlot}
          daySlots={selectedDay?.slots ?? []}
          spike={selectedSpike}
          scores={applianceScores}
          reasonFacts={reasonFacts}
          actionTags={actionTags}
          loading={assistantLoading}
          answer={assistantAnswer}
          error={assistantError}
          activeMode={assistantMode}
          onRequest={onRequestAssistant}
        />
      </div>
    </div>
  );
}
