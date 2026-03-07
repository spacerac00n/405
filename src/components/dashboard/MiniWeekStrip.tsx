import type { WeeklySummaryItem } from "@/types/energy";

import { cn } from "@/lib/utils";

type MiniWeekStripProps = {
  items: WeeklySummaryItem[];
  selectedDayKey: string | null;
  onSelect: (dayKey: string) => void;
};

export function MiniWeekStrip({
  items,
  selectedDayKey,
  onSelect,
}: MiniWeekStripProps) {
  if (!items.length) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/8 bg-white/[0.02] px-5 py-6 text-center text-sm text-slate-500">
        Upload a valid CSV or use the built-in week to begin.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-7">
      {items.map((item) => (
        <button
          key={item.dayKey}
          type="button"
          onClick={() => onSelect(item.dayKey)}
          className={cn(
            "rounded-[20px] border px-3 py-3 text-left transition",
            selectedDayKey === item.dayKey
              ? "border-cyan-300/35 bg-cyan-300/8"
              : "border-white/6 bg-white/[0.025] hover:bg-white/[0.05]",
          )}
        >
          <p className="text-sm font-medium text-white">{item.shortLabel}</p>
          <p className="mt-1 text-xs text-slate-500">{item.totalKwh.toFixed(1)} kWh</p>
        </button>
      ))}
    </div>
  );
}
