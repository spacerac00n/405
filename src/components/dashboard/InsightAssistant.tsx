"use client";

import { useState } from "react";

import type { EnergySlot, SpikeDetection } from "@/types/energy";
import type { ApplianceScore, AssistantMode } from "@/types/insights";

import { applianceProfiles } from "@/lib/config/applianceProfiles";
import { Card } from "@/components/shared/Card";
import { buildApplianceBars } from "@/lib/energy/buildApplianceBars";
import { formatKwh } from "@/lib/energy/formatters";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tier classification — exact same intensity formula as getThermalColor in
// HeatTimelineSlider, split into 4 visible colour bands:
//   hue = 220 - intensity * 210
//   hue > 130  (green)        intensity < 0.43  → "below" / Below average
//   hue 70-130 (yellow-green) intensity 0.43-0.71 → "normal"/ Normal usage
//   hue 20-70  (orange)       intensity 0.71-0.95 → "above" / Above average
//   hue < 20   (red)          intensity ≥ 0.95  → "high"  / High spike
// ---------------------------------------------------------------------------
type SlotTier = "high" | "above" | "normal" | "below";

function classifySlotTier(slot: EnergySlot | null, daySlots: EnergySlot[]): SlotTier {
  if (!slot || !daySlots.length) return "normal";
  const maxKwh = Math.max(...daySlots.map((s) => s.kwh), 0.01);
  const minKwh = Math.min(...daySlots.map((s) => s.kwh), 0);
  const intensity = maxKwh === minKwh ? 0.4 : (slot.kwh - minKwh) / (maxKwh - minKwh);
  if (intensity >= 0.95) return "high";
  if (intensity >= 0.71) return "above";
  if (intensity >= 0.43) return "normal";
  return "below";
}

type InsightAssistantProps = {
  selectedSlot: EnergySlot | null;
  daySlots: EnergySlot[];
  spike: SpikeDetection | null;
  scores: ApplianceScore[];
  reasonFacts: string[];
  actionTags: string[];
  loading: boolean;
  answer: string | null;
  error: string | null;
  activeMode: AssistantMode | null;
  onRequest: (mode: AssistantMode) => Promise<void>;
};

type ChipId = "why" | "action" | "impact";

const CHIPS: Array<{ id: ChipId; label: string; mode: AssistantMode }> = [
  { id: "why",    label: "Why",        mode: "explain_spike"   },
  { id: "action", label: "Action",     mode: "suggest_steps"   },
  { id: "impact", label: "Grid impact", mode: "estimate_savings" },
];

function deriveStatus(tier: SlotTier): {
  label: string;
  textColor: string;
  bgColor: string;
} {
  if (tier === "high")   return { label: "High spike",    textColor: "text-rose-400",    bgColor: "bg-rose-500/[0.10]"    };
  if (tier === "above")  return { label: "Above average", textColor: "text-amber-400",   bgColor: "bg-amber-500/[0.10]"   };
  if (tier === "normal") return { label: "Normal usage",  textColor: "text-slate-300",   bgColor: "bg-white/[0.04]"       };
  return                 { label: "Below average",        textColor: "text-emerald-400", bgColor: "bg-emerald-500/[0.08]" };
}

const APPLIANCE_SUGGESTION: Record<string, string> = {
  cooling: "Shift aircon start later or raise the temperature",
  heater:  "Shorten heater runtime",
  laundry: "Move washing machine to an off-peak slot",
};

const APPLIANCE_ACTION_HIGH: Record<string, string> = {
  cooling: "Shift aircon start later or raise the temperature — this is your biggest lever right now.",
  heater:  "Shorten hot-water heater runtime to cut this spike.",
  laundry: "Move this wash cycle to off-peak hours — it’s the clearest action for this spike.",
};

const APPLIANCE_ACTION_ABOVE: Record<string, string> = {
  cooling: "A small raise in temperature or a later start time would trim this slot noticeably.",
  heater:  "Shortening heater runtime a little would smooth this slot.",
  laundry: "Shifting the washing machine to an off-peak slot would reduce demand here.",
};

function fallbackChipText(
  chip: ChipId,
  tier: SlotTier,
  topAppliance: string | null,
  reasonFacts: string[],
): string {
  const isHigh  = tier === "high";
  const isAbove = tier === "above";
  const isBelow = tier === "below";

  if (chip === "why") {
    if ((isHigh || isAbove) && reasonFacts[0]) return reasonFacts[0];
    if (isHigh)  return "This slot is significantly higher than the rest of the day — it stands out as a high spike.";
    if (isAbove) return "This slot is in the upper range for the day — elevated compared to your typical half-hour.";
    if (isBelow) return "Great job — this slot used less energy than usual.";
    return "Nice work — this slot stayed within your normal pattern.";
  }
  if (chip === "action") {
    if (isHigh && topAppliance && APPLIANCE_ACTION_HIGH[topAppliance])  return APPLIANCE_ACTION_HIGH[topAppliance]!;
    if (isAbove && topAppliance && APPLIANCE_ACTION_ABOVE[topAppliance]) return APPLIANCE_ACTION_ABOVE[topAppliance]!;
    if (isBelow) return "Keep it going — you're building a smart energy-saving habit.";
    return "Keep up the good work — your usage looks well managed.";
  }
  // grid impact
  if (isHigh)  return "This slot is a high spike and adds significant demand. Shifting or reducing usage here would directly lower your peak and ease grid pressure at a busy time.";
  if (isAbove) return "This slot is slightly above your average. Spreading usage a little more evenly — rather than clustering it in the evening — helps keep demand manageable for everyone.";
  if (isBelow) return "This slot falls during a quieter period, so it adds less pressure to the grid. Keeping usage low during busy times like evenings makes a small but real difference.";
  return "This slot is within your normal range. Spreading usage more evenly through the day helps keep demand manageable for everyone.";
}

export function InsightAssistant({
  selectedSlot,
  daySlots,
  spike,
  scores,
  reasonFacts,
  actionTags,
  loading,
  answer,
  error,
  activeMode,
  onRequest,
}: InsightAssistantProps) {
  const [activeChip, setActiveChip] = useState<ChipId | null>(null);

  const tier       = classifySlotTier(selectedSlot, daySlots);
  const bars       = selectedSlot ? buildApplianceBars(selectedSlot, scores) : [];
  const topBar     = bars[0];
  const topProfile = topBar && topBar.energyShare > 0 ? applianceProfiles[topBar.appliance] : null;
  const topAppliance = topBar?.appliance ?? null;
  const status     = deriveStatus(tier);
  const isActionableState = tier === "high" || tier === "above";
  const actionLine = !topProfile && isActionableState
    ? "Caused by other appliances"
    : (topAppliance && APPLIANCE_SUGGESTION[topAppliance]) ?? actionTags[0] ?? "No action needed";

  function handleChip(chip: ChipId, mode: AssistantMode) {
    const next = activeChip === chip ? null : chip;
    setActiveChip(next);
    // Only call the AI for actionable states (spike or above average).
    // For normal/below-avg, the fallback copy is sufficient.
    const needsAi = tier === "high" || tier === "above";
    if (next && needsAi) onRequest(mode);
  }

  const activeChipObj  = CHIPS.find((c) => c.id === activeChip);
  const needsAi        = tier === "high" || tier === "above";
  const isLoadingChip  = loading && !!activeChipObj && activeMode === activeChipObj.mode;
  const hasAiResponse  = needsAi && !!activeChipObj && activeMode === activeChipObj.mode && !loading;
  const expandedText   = isLoadingChip
    ? null
    : hasAiResponse && (answer || error)
      ? (error ?? answer!)
      : activeChip
        ? fallbackChipText(activeChip, tier, topAppliance, reasonFacts)
        : null;

  return (
    <Card className="w-full max-w-[320px] space-y-4 rounded-[30px] p-4">

      {/* ── Header row ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
          Daily Insight Assistant
        </p>
      </div>

      {selectedSlot ? (
        <>
          {/* ── Primary summary card ───────────── */}
          <div className={cn("rounded-[20px] p-4 space-y-2.5", status.bgColor)}>
            {/* Time · usage — one compact line */}
            <p className="text-[13px] text-slate-400">
              {selectedSlot.label} · {formatKwh(selectedSlot.kwh)}
            </p>

            {/* Status — most visually dominant element */}
            <p className={cn("text-[22px] font-semibold leading-tight", status.textColor)}>
              {status.label}
            </p>

            {/* Main contributor */}
            {isActionableState && topProfile && (
              <p className="text-[13px] text-slate-300">
                Main use:{" "}
                <span className="font-medium text-white">{topProfile.label}</span>
              </p>
            )}

            {/* Action line */}
            {isActionableState ? (
              <p className="text-[13px] text-slate-400">Suggestion: {actionLine}</p>
            ) : null}
          </div>

          {/* ── Chip row ───────────────────────── */}
          <div className="flex gap-2">
            {CHIPS.map((chip) => {
              const isActive  = activeChip === chip.id;
              const isSpinning = loading && activeMode === chip.mode;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChip(chip.id, chip.mode)}
                  className={cn(
                    "flex-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 bg-white/[0.04] text-slate-400 hover:border-white/20 hover:text-slate-200",
                  )}
                >
                  {isSpinning ? "…" : chip.label}
                </button>
              );
            })}
          </div>

          {/* ── Expanded chip detail (progressive disclosure) ── */}
          {activeChip && (
            <div className="rounded-[18px] bg-white/[0.03] px-4 py-3.5">
              <p className="text-[13px] leading-6 text-slate-300">
                {isLoadingChip
                  ? <span className="text-slate-500">Thinking…</span>
                  : expandedText}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-12 text-center text-sm leading-7 text-slate-500">
          Load a full day and pick a slot to activate the assistant.
        </div>
      )}
    </Card>
  );
}
