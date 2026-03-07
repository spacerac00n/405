import type { EnergySlot, SpikeDetection } from "@/types/energy";

import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";

type CompactTimelineProps = {
  dayLabel: string | null;
  slots: EnergySlot[];
  selectedSlotTimestamp: string | null;
  spikes: SpikeDetection[];
  onSelect: (timestamp: string) => void;
  onExpand: () => void;
};

export function CompactTimeline({
  dayLabel,
  slots,
  selectedSlotTimestamp,
  spikes,
  onSelect,
  onExpand,
}: CompactTimelineProps) {
  const maxValue = Math.max(...slots.map((slot) => slot.kwh), 0.01);
  const spikeMap = new Map(spikes.map((spike) => [spike.timestamp, spike]));
  const selectedSlot = slots.find((slot) => slot.timestamp === selectedSlotTimestamp) ?? null;

  if (!slots.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/8 bg-white/[0.02] px-6 py-12 text-center text-sm text-slate-500">
        No full day is available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[30px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            {dayLabel ?? "Selected day"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {selectedSlot ? `${selectedSlot.label} • ${selectedSlot.kwh.toFixed(2)} kWh` : "Pick a half-hour slot"}
          </p>
        </div>
        <Button variant="ghost" size="xs" type="button" onClick={onExpand}>
          Expand analysis
        </Button>
      </div>
      <div
        className="grid h-24 items-end gap-1"
        style={{ gridTemplateColumns: "repeat(48, minmax(0, 1fr))" }}
      >
        {slots.map((slot) => {
          const selected = slot.timestamp === selectedSlotTimestamp;
          const spike = spikeMap.get(slot.timestamp);
          const height = `${Math.max(10, (slot.kwh / maxValue) * 100)}%`;

          return (
            <button
              key={slot.timestamp}
              type="button"
              onClick={() => onSelect(slot.timestamp)}
              className="relative flex h-full items-end"
              aria-label={`${slot.label}, ${slot.kwh.toFixed(2)} kWh`}
            >
              <span
                className={cn(
                  "w-full rounded-full bg-white/10 transition",
                  spike?.isSpike && "bg-emerald-300/60",
                  selected && "bg-amber-300 shadow-[0_0_20px_rgba(255,184,95,0.28)]",
                )}
                style={{ height }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] text-slate-600">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>11:30p</span>
      </div>
    </div>
  );
}
