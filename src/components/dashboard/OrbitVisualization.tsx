"use client";

import type { EnergySlot } from "@/types/energy";
import type { ApplianceScore } from "@/types/insights";

import { impactConfig } from "@/lib/config/impactConfig";
import { buildApplianceBars } from "@/lib/energy/buildApplianceBars";
import { cn } from "@/lib/utils";

type OrbitVisualizationProps = {
  slot: EnergySlot | null;
  scores: ApplianceScore[];
  size?: "hero" | "summary";
};

export function OrbitVisualization({
  slot,
  scores,
  size = "hero",
}: OrbitVisualizationProps) {
  if (!slot) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[28px] border border-dashed border-white/10 text-center text-sm text-slate-500",
          size === "hero" ? "h-[420px]" : "h-[260px]",
        )}
      >
        Select a slot to view appliance timing patterns.
      </div>
    );
  }

  // buildApplianceBars is the single source of truth for appliance ranking.
  // InsightAssistant calls the same function so "Strongest signal" and
  // "Main use" are always derived from an identical sort order.
  const bars = buildApplianceBars(slot, scores);
  const top = bars[0];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[36px] border border-white/6 bg-[radial-gradient(circle_at_15%_-15%,rgba(83,212,255,0.2),transparent_52%),radial-gradient(circle_at_90%_15%,rgba(143,155,255,0.18),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]",
        size === "hero" ? "p-6 sm:p-8" : "p-4 sm:p-5",
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-slate-300">
            Strongest signal: {top && top.energyShare > 0 ? top.shortLabel : "-"}
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Appliance contribution</p>
        </div>

        <div className={cn("space-y-4", size === "hero" ? "pt-2" : "pt-1")}>
          {bars.map((bar) => {
            const contributionWidth = `${(bar.energyShare * 100).toFixed(0)}%`;

            return (
              <div key={bar.appliance} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <div className="flex min-w-[122px] items-center gap-2 sm:min-w-[142px]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5">
                    <img src={bar.icon} alt={bar.shortLabel} className="h-5 w-5 opacity-95" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-200">{bar.shortLabel}</p>
                    <p className="text-[10px] text-slate-400">
                      {bar.estimatedKwh.toFixed(2)} kWh • {impactConfig.currencyLabel}
                      {bar.estimatedCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="relative h-11">
                  <div
                    className="absolute inset-y-0 left-0 flex items-center rounded-2xl bg-gradient-to-r from-cyan-400/85 to-teal-300/85 px-3"
                    style={{ width: contributionWidth }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-950">
                      {Math.round(bar.energyShare * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
