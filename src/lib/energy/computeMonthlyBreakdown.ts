import type { DayEnergySeries, EnergySlot, WeeklySummaryItem } from "@/types/energy";
import type { OnboardingProfile } from "@/types/onboarding";

import { scoringRules } from "@/lib/config/scoringRules";
import { getHourFraction, isWeekend, isWithinWindow } from "@/lib/energy/formatters";

// Combined visible share cap for the 3 tracked appliances
export const MONTHLY_TRACKED_CAP = 0.70;

// Fixed weight for background / base load (cooking, standby, fridge, lighting).
// Ensures tracked appliances cannot claim 100% of any slot's kWh even when
// all three are in-window — leaves a realistic floor for other household usage.
const BASE_WEIGHT = 0.30;

export type MonthlyApplianceBreakdown = {
  coolingKwh: number;
  heaterKwh: number;
  laundryKwh: number;
  /** Each value is the appliance's share of the monthly household total (0–100) */
  coolingPct: number;
  heaterPct: number;
  laundryPct: number;
  monthlyTotal: number;
  wasScaled: boolean;
};

/**
 * Computes habit-weighted presence shares for the 3 tracked appliances for a
 * single half-hour slot, based on window-fit and profile habit strength.
 *
 * Unlike inferApplianceScores (which skips calm/below-average slots entirely),
 * this function always produces non-zero weights for appliances whose window is
 * active — including baseline slots. This is the correct model for monthly
 * aggregation because persistent loads like overnight AC run even when usage
 * looks flat on a per-slot basis.
 */
function attributeSlot(
  slot: EnergySlot,
  profile: OnboardingProfile,
): { coolingShare: number; heaterShare: number; laundryShare: number } {
  const hour = getHourFraction(slot.timestamp);
  const weekend = isWeekend(slot.timestamp);

  // ── Cooling window fit — mirrors inferApplianceScores exactly ─────────────
  const coolingFit =
    profile.airconFrequency !== "rarely" && (
      profile.airconFrequency === "day_and_night" ||
      profile.airconWindow === "varies" ||
      (profile.airconWindow === "overnight" && (hour >= 21 || hour < 8)) ||
      (profile.airconWindow === "evening"   && hour >= 15.5 && hour < 24) ||
      (profile.airconWindow === "afternoon" && hour >= 12   && hour < 18)
    );
  const coolingWeight = coolingFit
    ? scoringRules.cooling.frequencyBoosts[profile.airconFrequency]
      + scoringRules.cooling.durationBoosts[profile.airconDuration]
      + scoringRules.cooling.windowBoosts[profile.airconWindow]
    : 0;

  // ── Heater window fit ─────────────────────────────────────────────────────
  const heaterFit =
    (profile.showerWindow === "morning" && isWithinWindow(hour, 5.5, 9.5)) ||
    (profile.showerWindow === "evening" && isWithinWindow(hour, 17.0, 22.0)) ||
    (profile.showerWindow === "both"    && (
      isWithinWindow(hour, 5.5, 9.5) || isWithinWindow(hour, 17.0, 22.0)
    ));
  const heaterWeight = heaterFit
    ? scoringRules.heater.windowBoosts[profile.showerWindow]
      + scoringRules.heater.durationBoosts[profile.showerLength]
    : 0;

  // ── Laundry window fit ────────────────────────────────────────────────────
  const laundryFit =
    (profile.laundryWindow === "morning"         && isWithinWindow(hour, 7, 12)) ||
    (profile.laundryWindow === "weekday_evening"  && !weekend && isWithinWindow(hour, 17, 23)) ||
    (profile.laundryWindow === "weekend"          && weekend  && isWithinWindow(hour, 9, 19)) ||
    (profile.laundryWindow === "varies"           && isWithinWindow(hour, 7, 22));
  const laundryWeight = laundryFit
    ? scoringRules.laundry.frequencyBoosts[profile.laundryFrequency]
      + scoringRules.laundry.windowBoosts[profile.laundryWindow]
    : 0;

  // Normalise: distribute among tracked appliances + background base weight.
  const total = coolingWeight + heaterWeight + laundryWeight + BASE_WEIGHT;
  return {
    coolingShare: coolingWeight / total,
    heaterShare:  heaterWeight  / total,
    laundryShare: laundryWeight / total,
  };
}

/**
 * Aggregates appliance attribution across all slots in a single calendar month.
 *
 * For every half-hour slot `attributeSlot` distributes the slot's kWh among
 * the 3 tracked appliances proportionally to their window-fit + habit weights.
 * Because the function runs on all slots (not just spikes), the result
 * reflects realistic monthly baseline consumption rather than spike-only peaks.
 *
 * A 70% cap is applied: if the three tracked appliances together exceed 70% of
 * the household's monthly total, all three are scaled down proportionally so
 * their combined visible share becomes exactly 70%, preserving relative ratios.
 */
export function computeMonthlyBreakdown(
  monthDays: WeeklySummaryItem[],
  allDays: DayEnergySeries[],
  profile: OnboardingProfile,
): MonthlyApplianceBreakdown {
  const monthlyTotal = monthDays.reduce((sum, d) => sum + d.totalKwh, 0);

  let coolingKwh = 0;
  let heaterKwh  = 0;
  let laundryKwh = 0;

  for (const summaryDay of monthDays) {
    const series = allDays.find((d) => d.dayKey === summaryDay.dayKey);
    if (!series) continue;
    for (const slot of series.slots) {
      const { coolingShare, heaterShare, laundryShare } = attributeSlot(slot, profile);
      coolingKwh += slot.kwh * coolingShare;
      heaterKwh  += slot.kwh * heaterShare;
      laundryKwh += slot.kwh * laundryShare;
    }
  }

  const trackedRaw = coolingKwh + heaterKwh + laundryKwh;
  const wasScaled  = monthlyTotal > 0 && (trackedRaw / monthlyTotal) > MONTHLY_TRACKED_CAP;
  const scale = wasScaled ? (MONTHLY_TRACKED_CAP * monthlyTotal) / trackedRaw : 1;
  coolingKwh *= scale;
  heaterKwh  *= scale;
  laundryKwh *= scale;

  const safe = monthlyTotal > 0 ? monthlyTotal : 1;
  return {
    coolingKwh,
    heaterKwh,
    laundryKwh,
    coolingPct: (coolingKwh / safe) * 100,
    heaterPct:  (heaterKwh  / safe) * 100,
    laundryPct: (laundryKwh / safe) * 100,
    monthlyTotal,
    wasScaled,
  };
}

