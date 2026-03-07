import type { DayEnergySeries, EnergySlot, SpikeDetection, WeeklySummaryItem } from "@/types/energy";
import type { ApplianceScore, AssistantMode } from "@/types/insights";

import { DayDropdown } from "@/components/dashboard/DayDropdown";
import { HeatTimelineSlider } from "@/components/dashboard/HeatTimelineSlider";
import { InsightAssistant } from "@/components/dashboard/InsightAssistant";
import { OrbitVisualization } from "@/components/dashboard/OrbitVisualization";

type UnderstandTabProps = {
  weeklySummary: WeeklySummaryItem[];
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
        <OrbitVisualization slot={selectedSlot} scores={applianceScores} size="hero" />
        <HeatTimelineSlider
          slots={selectedDay?.slots ?? []}
          selectedSlotTimestamp={selectedSlot?.timestamp ?? null}
          spikes={selectedSpikes}
          onSelect={onSelectSlot}
        />
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
