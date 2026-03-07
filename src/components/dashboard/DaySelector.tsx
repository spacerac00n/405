import type { WeeklySummaryItem } from "@/types/energy";

import { cn } from "@/lib/utils";

type DaySelectorProps = {
  items: WeeklySummaryItem[];
  selectedDayKey: string | null;
  onSelect: (dayKey: string) => void;
};

export function DaySelector({
  items,
  selectedDayKey,
  onSelect,
}: DaySelectorProps) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.dayKey}
          type="button"
          onClick={() => onSelect(item.dayKey)}
          className={cn(
            "rounded-full border px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition",
            item.dayKey === selectedDayKey
              ? "border-cyan-300/60 bg-cyan-300/10 text-white"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white",
          )}
        >
          {item.shortLabel}
        </button>
      ))}
    </div>
  );
}
