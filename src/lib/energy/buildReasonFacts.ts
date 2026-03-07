import type { DailyStats, EnergySlot } from "@/types/energy";
import type { ApplianceScore } from "@/types/insights";

import { formatKwh } from "@/lib/energy/formatters";

export function buildReasonFacts(
  slot: EnergySlot,
  dayStats: DailyStats,
  applianceScores: ApplianceScore[],
  spikeScore: number,
) {
  const facts: string[] = [];
  const topScores = applianceScores.slice(0, 3);

  if (dayStats.averageKwh > 0) {
    const lift = ((slot.kwh - dayStats.averageKwh) / dayStats.averageKwh) * 100;
    facts.push(
      `${slot.label} is ${lift >= 0 ? "+" : ""}${lift.toFixed(0)}% versus the daily average (${formatKwh(
        dayStats.averageKwh,
      )}).`,
    );
  }

  if (spikeScore >= 0.55) {
    facts.push("This slot qualifies as a meaningful spike relative to the rest of the day.");
  } else if (spikeScore >= 0.3) {
    facts.push("This slot is elevated, but it looks more moderate than a major one-off surge.");
  } else {
    facts.push("This slot is closer to routine household load than a major spike event.");
  }

  for (const item of topScores) {
    if (item.reasons[0]) {
      facts.push(item.reasons[0]);
    }
  }

  return facts.slice(0, 4);
}
