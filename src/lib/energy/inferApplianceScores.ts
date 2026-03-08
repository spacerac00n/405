import type { EnergySlot } from "@/types/energy";
import type { ApplianceName, ApplianceScore } from "@/types/insights";
import type { OnboardingProfile } from "@/types/onboarding";

import { scoringRules } from "@/lib/config/scoringRules";
import { computeSpikeForSlot } from "@/lib/energy/detectSpikes";
import {
  getHourFraction,
  isWeekend,
  isWithinWindow,
} from "@/lib/energy/formatters";
import { clamp } from "@/lib/utils";

type ScoreBucket = {
  raw: number;
  reasons: string[];
};

function createBucket(base: number) {
  return {
    raw: base,
    reasons: [] as string[],
  } satisfies ScoreBucket;
}

function pushReason(bucket: ScoreBucket, reason: string) {
  if (!bucket.reasons.includes(reason) && bucket.reasons.length < 4) {
    bucket.reasons.push(reason);
  }
}

function scoreConfidence(score: number, reasonCount: number, spikeScore: number) {
  return clamp(0.28 + score * 0.44 + reasonCount * 0.08 + spikeScore * 0.12, 0.2, 0.98);
}

export function inferApplianceScores(
  slot: EnergySlot,
  daySlots: EnergySlot[],
  profile: OnboardingProfile,
): ApplianceScore[] {
  const spike = computeSpikeForSlot(slot, daySlots);

  // ── Calm-state early exit ──────────────────────────────────────────────────────
  // Mirror the same classification used by InsightAssistant:
  //   below_avg : deltaFromAverage < -0.01
  //   normal    : !isSpike && deltaFromAverage ≤ 0.02
  //   above_avg : !isSpike && deltaFromAverage > 0.02
  //   spike     : isSpike
  //
  // For "below_avg" and "normal" there is no meaningful appliance-driven event,
  // so return zero scores for all tracked appliances immediately.
  const isCalm = !spike.isSpike && spike.deltaFromAverage <= 0.02;
  if (isCalm) {
    return (["cooling", "heater", "laundry", "cooking", "base_load"] as ApplianceName[]).map(
      (appliance) => ({
        appliance,
        score: 0,
        confidence: 0.2,
        reasons: [],
      } satisfies ApplianceScore),
    );
  }

  const hour = getHourFraction(slot.timestamp);
  const weekend = isWeekend(slot.timestamp);
  const s = spike.spikeScore;

  // ── Step 1: Binary window fit ─────────────────────────────────────────────
  // Each tracked appliance must fall within its profile-derived usage window.
  // An appliance that fails this check is scored 0 regardless of spike size.
  // This is the primary mechanism that keeps appliances off during irrelevant
  // hours — habitat boosts only apply once the window check passes.

  // Cooling: must be within the user's stated aircon window AND used at least occasionally.
  // day_and_night is always in-window.
  // "rarely" disqualifies even if the slot is in the stated window — habit is too weak.
  // Evening AC starts from mid-afternoon (15:30) to capture pre-cool periods.
  // Overnight AC is active from 21:00 through to early morning (8:00).
  const coolingFit =
    profile.airconFrequency !== "rarely" && (
      profile.airconFrequency === "day_and_night" ||
      (profile.airconWindow === "varies") ||
      (profile.airconWindow === "overnight" && (hour >= 21 || hour < 8)) ||
      (profile.airconWindow === "evening"   && hour >= 15.5 && hour < 24) ||
      (profile.airconWindow === "afternoon" && hour >= 12 && hour < 18)
    );

  // Heater: must be within the user's stated shower window.
  // Morning window: 5:30–9:30 (pre-work showers).
  // Evening window: 17:00–22:00 — most households shower by 10 pm; 22:30 is outside.
  const heaterFit =
    (profile.showerWindow === "morning" && isWithinWindow(hour, 5.5, 9.5)) ||
    (profile.showerWindow === "evening" && isWithinWindow(hour, 17.0, 22.0)) ||
    (profile.showerWindow === "both"    && (
      isWithinWindow(hour, 5.5, 9.5) || isWithinWindow(hour, 17.0, 22.0)
    ));

  // Laundry: must be within the user's stated laundry window.
  // Weekday-evening window starts at 17:00 — laundry often begins before dinner.
  const laundryFit =
    (profile.laundryWindow === "morning"         && isWithinWindow(hour, 7, 12)) ||
    (profile.laundryWindow === "weekday_evening"  && !weekend && isWithinWindow(hour, 17, 23)) ||
    (profile.laundryWindow === "weekend"          && weekend  && isWithinWindow(hour, 9, 19)) ||
    (profile.laundryWindow === "varies"           && isWithinWindow(hour, 7, 22));

  // Cooking: within any meal-time window.
  const cookingFit = scoringRules.cooking.mealWindows.some(
    (w) => isWithinWindow(hour, w.startHour, w.endHour),
  );

  // ── Step 2: Evidence scores (window-fit appliances only) ──────────────────
  // For each appliance that passes the window check, compute a score as:
  //   normalised_habit_strength × 0.65  +  spike_contribution  +  0.10
  // This produces naturally uneven scores — a strong habit + strong spike
  // leads to a dominant bar; a weak habit with mild spike stays modest.
  // Appliances that failed the window check stay at 0.

  const buckets: Record<ApplianceName, ScoreBucket> = {
    cooling:   createBucket(0),
    heater:    createBucket(0),
    laundry:   createBucket(0),
    cooking:   createBucket(0),
    base_load: createBucket(scoringRules.baseLoad.minimumScore),
  };

  if (coolingFit) {
    const habitPrior =
      scoringRules.cooling.frequencyBoosts[profile.airconFrequency] +
      scoringRules.cooling.durationBoosts[profile.airconDuration] +
      scoringRules.cooling.windowBoosts[profile.airconWindow];
    // Max possible habit prior across all three dimensions (day_and_night + overnight + overnight).
    const COOLING_HABIT_MAX = 0.32 + 0.26 + 0.24;
    const habitScore = clamp(habitPrior / COOLING_HABIT_MAX, 0, 1);
    // Cooling requires a more pronounced spike to contribute — AC draws sustained load,
    // not a short burst, so moderate spikes only weakly confirm it.
    const spikeContrib = s >= 0.20 ? scoringRules.cooling.spikeWeight * s : 0;
    // Weight: habit is the dominant signal (0.75) because frequency + duration together
    // encode how reliably the user runs AC.
    buckets.cooling.raw = clamp(habitScore * 0.75 + spikeContrib + 0.08, 0, 1);
    pushReason(buckets.cooling, "The time slot aligns with the reported air conditioning window.");
    if (s > 0.30) pushReason(buckets.cooling, "The spike magnitude supports active cooling load.");
    if (profile.airconFrequency === "almost_nightly" || profile.airconFrequency === "day_and_night")
      pushReason(buckets.cooling, "Frequent AC use makes cooling the most likely contributor during this period.");
  }

  if (heaterFit) {
    const habitPrior =
      scoringRules.heater.windowBoosts[profile.showerWindow] +
      scoringRules.heater.durationBoosts[profile.showerLength];
    // Max: both windows (0.22) + long showers (0.22) — but also temper by narrower window.
    // Using 0.44 + 0.06 buffer = 0.50 to slightly reduce the ceiling vs cooling.
    const HEATER_HABIT_MAX = 0.50;
    const habitScore = clamp(habitPrior / HEATER_HABIT_MAX, 0, 1);
    // Heater spikes are typically short bursts; only contribute when spike is moderate+.
    const spikeContrib = s >= 0.20 ? scoringRules.heater.spikeWeight * s : 0;
    buckets.heater.raw = clamp(habitScore * 0.65 + spikeContrib + 0.08, 0, 1);
    pushReason(buckets.heater, "The slot falls within the reported shower / water-heating period.");
    if (s > 0.20) pushReason(buckets.heater, "Short, sharper jumps are consistent with water-heating bursts.");
  }

  if (laundryFit) {
    const habitPrior =
      scoringRules.laundry.frequencyBoosts[profile.laundryFrequency] +
      scoringRules.laundry.windowBoosts[profile.laundryWindow];
    const LAUNDRY_HABIT_MAX = 0.24 + 0.20;
    const habitScore = clamp(habitPrior / LAUNDRY_HABIT_MAX, 0, 1);
    const spikeContrib =
      (s > 0.55 ? scoringRules.laundry.highSpikeBoost    : 0) +
      (s > 0.25 ? scoringRules.laundry.moderateSpikeBoost : 0);
    buckets.laundry.raw = clamp(habitScore * 0.65 + spikeContrib + 0.10, 0, 1);
    pushReason(buckets.laundry, "The timing matches the reported laundry window.");
    if (s > 0.25) pushReason(buckets.laundry, "Laundry appliances often produce medium-to-high half-hour spikes.");
  }

  if (cookingFit) {
    const spikeContrib = scoringRules.cooking.spikeWeight * s;
    buckets.cooking.raw = clamp(0.20 + spikeContrib + 0.05, 0, 1);
    pushReason(buckets.cooking, "The timing fits a likely meal-time cooking window.");
  }

  // ── Soft-plausibility fallback for elevated slots ──────────────────────
  // If all three tracked appliances scored 0 from the binary window checks
  // (e.g. an overnight-only AC user at 5 pm) but the slot is clearly elevated,
  // we compute a reduced soft-plausibility score for each appliance based on
  // habit strength alone, scaled down by 0.5 to signal lower confidence.
  // Only the most habit-supported appliance is allowed through at this reduced
  // weight — the others stay at 0 to keep the result uneven and realistic.
  const allTrackedZero =
    buckets.cooling.raw === 0 &&
    buckets.heater.raw === 0 &&
    buckets.laundry.raw === 0;

  if (allTrackedZero) {
    const softCooling = (
      scoringRules.cooling.frequencyBoosts[profile.airconFrequency] +
      scoringRules.cooling.durationBoosts[profile.airconDuration]
    ) / (0.32 + 0.26);
    const softHeater = (
      scoringRules.heater.windowBoosts[profile.showerWindow] +
      scoringRules.heater.durationBoosts[profile.showerLength]
    ) / (0.22 + 0.22);
    const softLaundry = (
      scoringRules.laundry.frequencyBoosts[profile.laundryFrequency] +
      scoringRules.laundry.windowBoosts[profile.laundryWindow]
    ) / (0.24 + 0.20);

    // Find the best-supported tracked appliance and assign it a reduced score.
    const best = Math.max(softCooling, softHeater, softLaundry);
    if (best > 0) {
      const spikeBoost = clamp(s * 0.25, 0, 0.20);
      if (softCooling === best) {
        buckets.cooling.raw = clamp(softCooling * 0.45 + spikeBoost + 0.08, 0, 0.55);
        pushReason(buckets.cooling, "Late-afternoon elevation is consistent with cooling starting up.");
      } else if (softHeater === best) {
        buckets.heater.raw = clamp(softHeater * 0.45 + spikeBoost + 0.08, 0, 0.55);
        pushReason(buckets.heater, "Late-afternoon usage is plausible for water-heating activity.");
      } else {
        buckets.laundry.raw = clamp(softLaundry * 0.45 + spikeBoost + 0.08, 0, 0.55);
        pushReason(buckets.laundry, "Laundry activity before the evening period is plausible.");
      }
    }
  }

  // base_load: boosted when no tracked appliance clearly dominates.
  const strongestTracked = Math.max(
    buckets.cooling.raw,
    buckets.heater.raw,
    buckets.laundry.raw,
    buckets.cooking.raw,
  );
  if (strongestTracked < 0.45) {
    buckets.base_load.raw += scoringRules.baseLoad.lowCompetitionBoost;
    pushReason(buckets.base_load, "No single appliance pattern dominates, so background load stays relevant.");
  }
  pushReason(buckets.base_load, "Household-level data always includes fridges, routers, lighting, and standby devices.");

  // ── Step 3: Soft plausibility gate (elevated slots only) ─────────────────
  // Any window-fit appliance that cleared the binary check registers at 0.10
  // minimum from the constant offset, so only truly trivial scores (< 0.15)
  // get zeroed here.  base_load is exempt — it is a background signal.
  const MIN_SCORE = 0.15;

  return (Object.entries(buckets) as Array<[ApplianceName, ScoreBucket]>)
    .map(([appliance, bucket]) => {
      let score = clamp(bucket.raw, 0, 1);
      if (appliance !== "base_load" && score < MIN_SCORE) {
        score = 0;
      }
      return {
        appliance,
        score,
        confidence: scoreConfidence(score, bucket.reasons.length, s),
        reasons: bucket.reasons.slice(0, 3),
      } satisfies ApplianceScore;
    })
    .sort((left, right) => right.score - left.score);
}
