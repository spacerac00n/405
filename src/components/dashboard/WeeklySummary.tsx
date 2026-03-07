import type { WeeklySummaryItem } from "@/types/energy";

import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { cn } from "@/lib/utils";

type WeeklySummaryProps = {
  items: WeeklySummaryItem[];
  selectedDayKey: string | null;
  onSelect: (dayKey: string) => void;
};

export function WeeklySummary({
  items,
  selectedDayKey,
  onSelect,
}: WeeklySummaryProps) {
  return (
    <Card className="space-y-6">
      <SectionTitle
        eyebrow="Weekly Overview"
        title="Seven-day energy pulse"
        subtitle="Scan daily totals first, then drill into the half-hour slot that best explains the spike."
      />
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-7">
          {items.map((item) => (
            <button
              key={item.dayKey}
              type="button"
              onClick={() => onSelect(item.dayKey)}
              className={cn(
                "rounded-[24px] border px-4 py-4 text-left transition",
                selectedDayKey === item.dayKey
                  ? "border-cyan-300/60 bg-cyan-300/10 shadow-[0_0_32px_rgba(83,212,255,0.14)]"
                  : "border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{item.shortLabel}</p>
                <Badge className="border-white/10 bg-white/[0.04] text-slate-400">
                  {item.spikeCount} spikes
                </Badge>
              </div>
              <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
                {item.totalKwh.toFixed(1)}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">kWh total</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/6">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(83,212,255,0.9),rgba(139,231,143,0.85))]"
                  style={{ width: `${Math.min(100, (item.peakKwh / Math.max(item.totalKwh, 0.01)) * 240)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[26px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center text-sm leading-7 text-slate-400">
          No complete seven-day series is active yet. Upload a CSV or plug records into the
          placeholder dataset module.
        </div>
      )}
    </Card>
  );
}
