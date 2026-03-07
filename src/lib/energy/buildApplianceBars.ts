import type { EnergySlot } from "@/types/energy";
import type { ApplianceScore } from "@/types/insights";

import { applianceProfiles } from "@/lib/config/applianceProfiles";
import { impactConfig } from "@/lib/config/impactConfig";

export type VisualAppliance = "cooling" | "heater" | "laundry";

export type ApplianceBar = {
  appliance: VisualAppliance;
  label: string;
  shortLabel: string;
  icon: string;
  score: number;
  energyShare: number;
  estimatedKwh: number;
  estimatedCost: number;
};

export const VISUAL_APPLIANCES: VisualAppliance[] = ["cooling", "heater", "laundry"];

const FALLBACK_RATE_PER_KWH = 0.3;

/**
 * Converts raw appliance scores for a selected slot into display-ready bars.
 *
 * This is the single source of truth for appliance ranking used by both
 * OrbitVisualization ("Strongest signal") and InsightAssistant ("Main use").
 * Both components must call this function so they always agree on which
 * appliance is leading.
 */
export function buildApplianceBars(slot: EnergySlot, scores: ApplianceScore[]): ApplianceBar[] {
  const scoreMap = new Map(scores.map((entry) => [entry.appliance, entry.score]));
  const rawScores = VISUAL_APPLIANCES.map((appliance) => scoreMap.get(appliance) ?? 0);
  const totalWeight = rawScores.reduce((sum, value) => sum + value, 0) || 0;

  // Normalize to proportional shares across tracked appliances.
  const normalizedShares = rawScores.map((s) => (totalWeight > 0 ? s / totalWeight : 0));

  // Rank-aware caps: tighter when more appliances are active.
  //  1 → 60%  |  2 → [50%, 28%]  |  3 → [40%, 25%, 18%]
  const activeCnt = normalizedShares.filter((s) => s > 0).length;

  const sortedIndices = normalizedShares
    .map((share, i) => ({ share, i }))
    .sort((a, b) => b.share - a.share)
    .map(({ i }) => i);

  const caps =
    activeCnt === 1 ? [0.60, 0.60, 0.60]
    : activeCnt === 2 ? [0.50, 0.28, 0.28]
    : [0.40, 0.25, 0.18];

  const cappedShares = [...normalizedShares];
  sortedIndices.forEach((idx, rank) => {
    if (cappedShares[idx] > 0) {
      cappedShares[idx] = Math.min(cappedShares[idx], caps[rank] ?? caps[caps.length - 1]);
    }
  });

  // Cooling priority: when active, cooling always leads the chart.
  const coolingIdx = VISUAL_APPLIANCES.indexOf("cooling");
  const coolingShare = cappedShares[coolingIdx];
  if (coolingShare > 0) {
    const otherMax = cappedShares.reduce(
      (max, share, i) => (i !== coolingIdx ? Math.max(max, share) : max),
      0,
    );
    if (coolingShare <= otherMax) {
      cappedShares[coolingIdx] = Math.min(otherMax + 0.05, caps[0]);
    }
  }

  // Heater constraint: must stay strictly below cooling when both are active.
  const heaterIdx = VISUAL_APPLIANCES.indexOf("heater");
  const finalCooling = cappedShares[coolingIdx];
  if (finalCooling > 0 && cappedShares[heaterIdx] >= finalCooling) {
    cappedShares[heaterIdx] = Math.max(finalCooling - 0.05, 0);
  }

  // Hard ceiling: tracked total must not exceed 85%.
  const TRACKED_MAX_TOTAL = 0.85;
  const totalCapped = cappedShares.reduce((sum, s) => sum + s, 0);
  if (totalCapped > TRACKED_MAX_TOTAL) {
    const scale = TRACKED_MAX_TOTAL / totalCapped;
    cappedShares.forEach((_, i) => { cappedShares[i] *= scale; });
  }

  const billingRate = impactConfig.billingRatePerKwh ?? FALLBACK_RATE_PER_KWH;

  return VISUAL_APPLIANCES.map((appliance, index) => {
    const profile = applianceProfiles[appliance];
    const score = scoreMap.get(appliance) ?? 0;
    const energyShare = cappedShares[index];
    const estimatedKwh = slot.kwh * energyShare;
    const estimatedCost = estimatedKwh * billingRate;

    return {
      appliance,
      label: profile.label,
      shortLabel: profile.shortLabel,
      icon: profile.icon,
      score,
      energyShare,
      estimatedKwh,
      estimatedCost,
    };
  }).sort((left, right) => right.energyShare - left.energyShare);
}
