import type { DailyStats, EnergySlot } from "@/types/energy";

export function calculateDailyStats(daySlots: EnergySlot[]): DailyStats {
  if (!daySlots.length) {
    return {
      averageKwh: 0,
      standardDeviation: 0,
      totalKwh: 0,
      minKwh: 0,
      maxKwh: 0,
    };
  }

  const totalKwh = daySlots.reduce((sum, slot) => sum + slot.kwh, 0);
  const averageKwh = totalKwh / daySlots.length;
  const variance =
    daySlots.reduce((sum, slot) => {
      return sum + (slot.kwh - averageKwh) ** 2;
    }, 0) / daySlots.length;

  return {
    averageKwh,
    standardDeviation: Math.sqrt(variance),
    totalKwh,
    minKwh: Math.min(...daySlots.map((slot) => slot.kwh)),
    maxKwh: Math.max(...daySlots.map((slot) => slot.kwh)),
  };
}
