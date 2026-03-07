import type { OnboardingProfile } from "@/types/onboarding";

type HabitBoosts<T extends string> = Record<T, number>;

export type TimeWindow = {
  label: string;
  startHour: number;
  endHour: number;
};

export const scoringRules = {
  spike: {
    standardDeviationMultiplier: 1.8,
    baselineFloorDelta: 0.28,
    zScoreCap: 3,
  },
  cooling: {
    base: 0.12,
    activeWindows: [
      { label: "late evening", startHour: 21, endHour: 24 },
      { label: "overnight", startHour: 0, endHour: 7 },
    ] satisfies TimeWindow[],
    frequencyBoosts: {
      rarely: 0.04,
      few_nights: 0.12,
      almost_nightly: 0.22,
      day_and_night: 0.32,
    } satisfies HabitBoosts<OnboardingProfile["airconFrequency"]>,
    windowBoosts: {
      afternoon: 0.08,
      evening: 0.16,
      overnight: 0.24,
      varies: 0.1,
    } satisfies HabitBoosts<OnboardingProfile["airconWindow"]>,
    durationBoosts: {
      "<2h": 0.04,
      "2-4h": 0.12,
      "4-8h": 0.2,
      overnight: 0.26,
    } satisfies HabitBoosts<OnboardingProfile["airconDuration"]>,
    aboveAverageBoost: 0.2,
    spikeWeight: 0.28,
  },
  heater: {
    base: 0.1,
    activeWindows: [
      { label: "morning shower", startHour: 6, endHour: 8 },
      { label: "evening shower", startHour: 19, endHour: 22 },
    ] satisfies TimeWindow[],
    windowBoosts: {
      morning: 0.12,
      evening: 0.18,
      both: 0.22,
    } satisfies HabitBoosts<OnboardingProfile["showerWindow"]>,
    durationBoosts: {
      short: 0.05,
      medium: 0.12,
      long: 0.22,
    } satisfies HabitBoosts<OnboardingProfile["showerLength"]>,
    spikeWeight: 0.18,
  },
  laundry: {
    base: 0.08,
    weekdayEveningWindow: { label: "weekday evening", startHour: 18, endHour: 23 } satisfies TimeWindow,
    weekendDayWindow: { label: "weekend daytime", startHour: 9, endHour: 18 } satisfies TimeWindow,
    morningWindow: { label: "morning", startHour: 7, endHour: 11 } satisfies TimeWindow,
    frequencyBoosts: {
      "1-2": 0.06,
      "3-4": 0.14,
      daily: 0.24,
    } satisfies HabitBoosts<OnboardingProfile["laundryFrequency"]>,
    windowBoosts: {
      weekday_evening: 0.2,
      weekend: 0.2,
      morning: 0.16,
      varies: 0.08,
    } satisfies HabitBoosts<OnboardingProfile["laundryWindow"]>,
    moderateSpikeBoost: 0.12,
    highSpikeBoost: 0.22,
  },
  cooking: {
    base: 0.08,
    mealWindows: [
      { label: "breakfast", startHour: 7, endHour: 9 },
      { label: "lunch", startHour: 12, endHour: 14 },
      { label: "dinner", startHour: 18, endHour: 20 },
    ] satisfies TimeWindow[],
    mealtimeBoost: 0.24,
    spikeWeight: 0.14,
  },
  baseLoad: {
    minimumScore: 0.18,
    quietPeriodBoost: 0.18,
    lowCompetitionBoost: 0.28,
  },
} as const;
