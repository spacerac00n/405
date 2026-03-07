import type { DayEnergySeries, EnergySlot } from "@/types/energy";
import type { ImpactMetricCard, ImpactMetrics } from "@/types/insights";

import { impactConfig } from "@/lib/config/impactConfig";
import { comparisonScenario } from "@/lib/data/comparisonScenario";
import { getHourFraction, isWithinWindow } from "@/lib/energy/formatters";

function buildMetricCard(args: {
  key: ImpactMetricCard["key"];
  label: string;
  value: number | null;
  unit: string;
  description: string;
  benchmarkValue?: number | null;
}) {
  return {
    key: args.key,
    label: args.label,
    value: args.value,
    unit: args.unit,
    description: args.description,
    benchmarkLabel: impactConfig.comparisonLabel,
    benchmarkValue: args.benchmarkValue,
  } satisfies ImpactMetricCard;
}

function getPeakShare(slots: EnergySlot[]) {
  const total = slots.reduce((sum, slot) => sum + slot.kwh, 0);

  if (total <= 0) {
    return null;
  }

  const peakTotal = slots.reduce((sum, slot) => {
    const hour = getHourFraction(slot.timestamp);
    const inPeak = impactConfig.peakWindows.some((window) =>
      isWithinWindow(hour, window.startHour, window.endHour),
    );

    return inPeak ? sum + slot.kwh : sum;
  }, 0);

  return peakTotal / total;
}

export function estimateImpact(daySeries: DayEnergySeries[]): ImpactMetrics {
  const allSlots = daySeries.flatMap((series) => series.slots);
  const averageDailyKwh =
    daySeries.length > 0
      ? daySeries.reduce((sum, series) => sum + series.totalKwh, 0) / daySeries.length
      : null;
  const projectedMonthlyKwh =
    averageDailyKwh === null ? null : averageDailyKwh * 30;

  // Sum kWh only for days that fall in the current real-world calendar month (YYYY-MM)
  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const currentMonthSeries = daySeries.filter((s) => s.dayKey.startsWith(currentYearMonth));
  const currentMonthKwh =
    currentMonthSeries.length > 0
      ? currentMonthSeries.reduce((sum, s) => sum + s.totalKwh, 0)
      : null;

  const estimatedMonthlyBill =
    projectedMonthlyKwh !== null && impactConfig.billingRatePerKwh !== undefined
      ? projectedMonthlyKwh * impactConfig.billingRatePerKwh
      : null;
  const estimatedCo2 =
    projectedMonthlyKwh !== null && impactConfig.co2KgPerKwh !== undefined
      ? projectedMonthlyKwh * impactConfig.co2KgPerKwh
      : null;
  const peakShare = getPeakShare(allSlots);

  return {
    estimatedMonthlyBill: buildMetricCard({
      key: "bill",
      label: "Estimated Monthly Bill",
      value: estimatedMonthlyBill,
      unit: impactConfig.currencyLabel,
      description:
        estimatedMonthlyBill === null
          ? "Add a billing rate in impactConfig to unlock this metric."
          : "Projected from the active daily average.",
      benchmarkValue: comparisonScenario.metricBenchmarks?.bill ?? null,
    }),
    estimatedCo2: buildMetricCard({
      key: "carbon",
      label: "Estimated CO2",
      value: estimatedCo2,
      unit: "kg",
      description:
        estimatedCo2 === null
          ? "Add an emissions factor in impactConfig to unlock this metric."
          : "Projected from the active daily average.",
      benchmarkValue: comparisonScenario.metricBenchmarks?.carbon ?? null,
    }),
    peakTimeShare: buildMetricCard({
      key: "peak",
      label: "Peak-Time Usage Share",
      value: peakShare === null ? null : peakShare * 100,
      unit: "%",
      description: "Share of total usage that falls inside the configured peak window.",
      benchmarkValue:
        comparisonScenario.metricBenchmarks?.peak === null ||
        comparisonScenario.metricBenchmarks?.peak === undefined
          ? null
          : comparisonScenario.metricBenchmarks.peak * 100,
    }),
    comparisonSeries: comparisonScenario.series,
    currentMonthKwh,
  };
}
