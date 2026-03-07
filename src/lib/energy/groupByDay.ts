import type { DayEnergySeries, EnergySlot } from "@/types/energy";

import { calculateDailyStats } from "@/lib/energy/calculateDailyStats";
import { formatDayLabel } from "@/lib/energy/formatters";

export function groupByDay(slots: EnergySlot[]) {
  const byDay = new Map<string, EnergySlot[]>();

  for (const slot of slots) {
    const current = byDay.get(slot.dayKey) ?? [];
    current.push(slot);
    byDay.set(slot.dayKey, current);
  }

  const series: DayEnergySeries[] = [...byDay.entries()]
    .map(([dayKey, daySlots]) => {
      const ordered = [...daySlots].sort((left, right) =>
        left.timestamp.localeCompare(right.timestamp),
      );

      if (ordered.length !== 48) {
        return null;
      }

      const stats = calculateDailyStats(ordered);

      return {
        dayKey,
        label: formatDayLabel(dayKey),
        slots: ordered,
        totalKwh: stats.totalKwh,
        averageKwh: stats.averageKwh,
        peakKwh: stats.maxKwh,
      } satisfies DayEnergySeries;
    })
    .filter((value): value is DayEnergySeries => Boolean(value));

  return series.sort((left, right) => left.dayKey.localeCompare(right.dayKey));
}
