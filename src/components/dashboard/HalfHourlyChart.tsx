import type { DailyStats, EnergySlot, SpikeDetection } from "@/types/energy";

import { formatKwh } from "@/lib/energy/formatters";
import { cn } from "@/lib/utils";

type HalfHourlyChartProps = {
  slots: EnergySlot[];
  selectedSlotTimestamp: string | null;
  spikes: SpikeDetection[];
  stats: DailyStats | null;
  onSelect: (timestamp: string) => void;
};

export function HalfHourlyChart({
  slots,
  selectedSlotTimestamp,
  spikes,
  stats,
  onSelect,
}: HalfHourlyChartProps) {
  const maxValue = Math.max(...slots.map((slot) => slot.kwh), 0.01);
  const spikeMap = new Map(spikes.map((spike) => [spike.timestamp, spike]));

  return (
    <div className="space-y-4">
      {slots.length ? (
        <>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.22em] text-slate-500">
            <span>{stats ? `Total ${formatKwh(stats.totalKwh, 1)}` : "No day selected"}</span>
            <span>{stats ? `Avg ${formatKwh(stats.averageKwh)}` : "—"}</span>
            <span>{stats ? `Peak ${formatKwh(stats.maxKwh)}` : "—"}</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              <div
                className="grid h-72 items-end gap-1 rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] p-4"
                style={{ gridTemplateColumns: "repeat(48, minmax(0, 1fr))" }}
              >
                {slots.map((slot) => {
                  const spike = spikeMap.get(slot.timestamp);
                  const selected = slot.timestamp === selectedSlotTimestamp;
                  const height = `${Math.max(8, (slot.kwh / maxValue) * 100)}%`;

                  return (
                    <button
                      key={slot.timestamp}
                      type="button"
                      onClick={() => onSelect(slot.timestamp)}
                      className={cn(
                        "group relative flex h-full items-end rounded-full transition focus:outline-none",
                        selected && "z-10",
                      )}
                      aria-label={`${slot.label}, ${slot.kwh.toFixed(2)} kWh`}
                    >
                      <span
                        className={cn(
                          "relative w-full rounded-full bg-[linear-gradient(180deg,rgba(83,212,255,0.9),rgba(83,212,255,0.18))] transition duration-200 group-hover:brightness-110",
                          selected &&
                            "bg-[linear-gradient(180deg,rgba(255,184,95,0.96),rgba(255,184,95,0.28))] shadow-[0_0_28px_rgba(255,184,95,0.32)]",
                          spike?.isSpike &&
                            !selected &&
                            "bg-[linear-gradient(180deg,rgba(139,231,143,0.92),rgba(83,212,255,0.18))]",
                        )}
                        style={{ height }}
                      />
                      {spike?.isSpike ? (
                        <span
                          className={cn(
                            "absolute -top-2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full",
                            selected ? "bg-amber-300" : "bg-emerald-300",
                          )}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid text-[10px] uppercase tracking-[0.2em] text-slate-500" style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr))" }}>
                {["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"].map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm leading-7 text-slate-500">
          The half-hour chart appears here once a complete 48-slot day is available.
        </div>
      )}
    </div>
  );
}
