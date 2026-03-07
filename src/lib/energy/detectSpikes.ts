import type { EnergySlot, SpikeDetection } from "@/types/energy";

import { scoringRules } from "@/lib/config/scoringRules";
import { calculateDailyStats } from "@/lib/energy/calculateDailyStats";
import { clamp } from "@/lib/utils";

export function computeSpikeForSlot(slot: EnergySlot, daySlots: EnergySlot[]) {
  const stats = calculateDailyStats(daySlots);
  const deltaFromAverage = slot.kwh - stats.averageKwh;
  const standardDeviation = stats.standardDeviation || 0.0001;
  const zScore = deltaFromAverage / standardDeviation;
  const threshold =
    stats.averageKwh +
    Math.max(
      scoringRules.spike.baselineFloorDelta,
      stats.standardDeviation * scoringRules.spike.standardDeviationMultiplier,
    );
  const normalizedZ = clamp(
    zScore / scoringRules.spike.zScoreCap,
    0,
    1,
  );
  const relativeDelta =
    stats.averageKwh > 0 ? clamp(deltaFromAverage / stats.averageKwh, 0, 1.2) : 0;
  const spikeScore = clamp(relativeDelta * 0.55 + normalizedZ * 0.45, 0, 1);

  return {
    timestamp: slot.timestamp,
    dayKey: slot.dayKey,
    spikeScore,
    deltaFromAverage,
    zScore,
    threshold,
    isSpike: slot.kwh >= threshold,
  } satisfies SpikeDetection;
}

export function detectSpikes(daySlots: EnergySlot[]) {
  return daySlots.map((slot) => computeSpikeForSlot(slot, daySlots));
}
