import type { DayEnergySeries } from "@/types/energy";
import type {
  ChallengeKey,
  EnergyChallenge,
  HabitInsights,
} from "@/types/habits";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const BASELINE_WINDOW = 7;
const WEEK_STREAK_DAYS = 7;
const WEEK_CHALLENGE_POINTS = 10;

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sortByDay(series: DayEnergySeries[]) {
  return [...series].sort((left, right) => left.dayKey.localeCompare(right.dayKey));
}

function toDate(dayKey: string) {
  return new Date(`${dayKey}T00:00:00`);
}

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dayKey: string, days: number) {
  const date = toDate(dayKey);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
}

function weekStartKey(dayKey: string) {
  const date = toDate(dayKey);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return toDayKey(date);
}

function buildWeekKeys(mondayKey: string) {
  return Array.from({ length: WEEK_STREAK_DAYS }, (_, index) => addDays(mondayKey, index));
}

function computeEfficiencyScore(day: DayEnergySeries, baselineTotal: number) {
  const totalRatio = baselineTotal > 0 ? day.totalKwh / baselineTotal : 1;
  const peakRatio = day.averageKwh > 0 ? day.peakKwh / day.averageKwh : 1;
  const loadStability = clamp(1 - (peakRatio - 1) / 1.6, 0, 1);
  const usageControl = clamp(1 - (totalRatio - 0.9), 0, 1);

  return Math.round((usageControl * 0.65 + loadStability * 0.35) * 100);
}

function countSpikeSlots(day: DayEnergySeries) {
  if (day.averageKwh <= 0) return 0;
  return day.slots.filter((slot) => slot.kwh > day.averageKwh * 1.35).length;
}

function getHour(timestamp: string) {
  const parsed = new Date(timestamp.length === 16 ? `${timestamp}:00` : timestamp);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getHours();
}

function sumWindowKwh(day: DayEnergySeries, startHour: number, endHour: number) {
  return day.slots
    .filter((slot) => {
      const hour = getHour(slot.timestamp);
      if (startHour <= endHour) {
        return hour >= startHour && hour < endHour;
      }
      return hour >= startHour || hour < endHour;
    })
    .reduce((sum, slot) => sum + slot.kwh, 0);
}

function challengeMet(
  challengeKey: ChallengeKey,
  day: DayEnergySeries,
  baselineTotal: number,
  baselineEvening: number,
) {
  if (challengeKey === "lower_daily_usage") {
    return day.totalKwh <= baselineTotal * 0.95;
  }

  if (challengeKey === "efficient_evening_usage") {
    const eveningKwh = sumWindowKwh(day, 18, 23);
    return eveningKwh <= baselineEvening * 0.92;
  }

  const nightKwh = sumWindowKwh(day, 21, 6);
  const nightAverage = nightKwh / 18;
  return day.averageKwh > 0
    ? nightAverage <= day.averageKwh * 1.05 && countSpikeSlots(day) <= 9
    : false;
}

function buildDailyInsight(args: {
  latest: DayEnergySeries;
  baselineTotal: number;
  streakDays: number;
  weeklyPoints: number;
}) {
  const { latest, baselineTotal, streakDays, weeklyPoints } = args;
  const vsBaseline =
    baselineTotal > 0
      ? ((baselineTotal - latest.totalKwh) / baselineTotal) * 100
      : 0;

  if (weeklyPoints > 0) {
    return `Great work. You completed weekly challenges and earned ${weeklyPoints} points this week.`;
  }

  if (streakDays > 0) {
    return `You are on a ${streakDays}-day streak this week. Keep the momentum to reach Sunday rewards.`;
  }

  if (vsBaseline > 0) {
    return `Usage is ${Math.abs(vsBaseline).toFixed(0)}% below baseline. Keep this up through Sunday to earn weekly points.`;
  }

  return "Weekly scoring runs Monday to Sunday. Build consistency this week to earn points.";
}

export function buildHabitInsights(
  daySeries: DayEnergySeries[],
  challenges: EnergyChallenge[],
): HabitInsights {
  if (!daySeries.length) {
    return {
      efficiencyScore: 0,
      streakDays: 0,
      longestStreak: 0,
      rewardPoints: 0,
      weeklyPoints: 0,
      activeChallengeCount: challenges.length,
      dailyInsight: "Upload complete daily data to start weekly challenge tracking.",
      challengeProgress: challenges.map((challenge) => ({
        key: challenge.key,
        title: challenge.title,
        durationDays: 7,
        completedDays: 0,
        progress: 0,
        metToday: false,
      })),
      challengePoints: challenges.map((challenge) => ({
        key: challenge.key,
        title: challenge.title,
        weeklyPoints: 0,
        cumulativePoints: 0,
        completedThisWeek: false,
      })),
      latestDayKey: null,
    };
  }

  const sorted = sortByDay(daySeries);
  const byDayKey = new Map(sorted.map((day) => [day.dayKey, day]));
  const latest = sorted[sorted.length - 1];
  const latestWeekStart = weekStartKey(latest.dayKey);
  const latestWeekKeys = buildWeekKeys(latestWeekStart);

  const baselineDays = sorted.slice(0, Math.min(BASELINE_WINDOW, sorted.length));
  const baselineTotal = average(baselineDays.map((item) => item.totalKwh));
  const baselineEvening = average(
    baselineDays.map((item) => sumWindowKwh(item, 18, 23)),
  );

  const efficiencyByDay = sorted.map((day) => computeEfficiencyScore(day, baselineTotal));
  const efficiencyScore = efficiencyByDay[efficiencyByDay.length - 1] ?? 0;

  const metMap = new Map<string, Map<ChallengeKey, boolean>>();
  for (const day of sorted) {
    const status = new Map<ChallengeKey, boolean>();
    for (const challenge of challenges) {
      status.set(
        challenge.key,
        challengeMet(challenge.key, day, baselineTotal, baselineEvening),
      );
    }
    metMap.set(day.dayKey, status);
  }

  const challengeProgress = challenges.map((challenge) => {
    const completedDays = latestWeekKeys.reduce((count, key) => {
      const dayStatus = metMap.get(key);
      return count + (dayStatus?.get(challenge.key) ? 1 : 0);
    }, 0);

    const latestStatus = metMap.get(latest.dayKey)?.get(challenge.key) ?? false;

    return {
      key: challenge.key,
      title: challenge.title,
      durationDays: 7 as const,
      completedDays,
      progress: clamp(completedDays / WEEK_STREAK_DAYS, 0, 1),
      metToday: latestStatus,
    };
  });

  const weekStarts = Array.from(
    new Set(sorted.map((day) => weekStartKey(day.dayKey))),
  ).sort((a, b) => a.localeCompare(b));

  const challengePoints = challenges.map((challenge) => {
    let cumulativePoints = 0;
    let weeklyPoints = 0;
    let completedThisWeek = false;

    for (const monday of weekStarts) {
      const keys = buildWeekKeys(monday);
      const weekDays = keys.map((key) => byDayKey.get(key)).filter(Boolean) as DayEnergySeries[];

      if (weekDays.length !== WEEK_STREAK_DAYS) {
        continue;
      }

      const challengeComplete = keys.every(
        (key) => metMap.get(key)?.get(challenge.key) ?? false,
      );

      if (!challengeComplete) {
        continue;
      }

      cumulativePoints += WEEK_CHALLENGE_POINTS;

      if (monday === latestWeekStart) {
        weeklyPoints = WEEK_CHALLENGE_POINTS;
        completedThisWeek = true;
      }
    }

    return {
      key: challenge.key,
      title: challenge.title,
      weeklyPoints,
      cumulativePoints,
      completedThisWeek,
    };
  });

  const rewardPoints = challengePoints.reduce((sum, item) => sum + item.cumulativePoints, 0);
  const weeklyPoints = challengePoints.reduce((sum, item) => sum + item.weeklyPoints, 0);

  const latestWeekDays = latestWeekKeys
    .map((key) => byDayKey.get(key))
    .filter(Boolean) as DayEnergySeries[];
  const latestWeekAnyMet = latestWeekDays.map((day) => {
    const dayStatus = metMap.get(day.dayKey);
    return challenges.some((challenge) => dayStatus?.get(challenge.key) ?? false);
  });

  let streakDays = 0;
  for (let index = latestWeekAnyMet.length - 1; index >= 0; index -= 1) {
    if (latestWeekAnyMet[index]) {
      streakDays += 1;
      continue;
    }
    break;
  }

  let longestStreak = 0;
  let running = 0;
  for (const dayMet of latestWeekAnyMet) {
    if (dayMet) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
      continue;
    }
    running = 0;
  }

  return {
    efficiencyScore,
    streakDays,
    longestStreak,
    rewardPoints,
    weeklyPoints,
    activeChallengeCount: challenges.length,
    dailyInsight: buildDailyInsight({
      latest,
      baselineTotal,
      streakDays,
      weeklyPoints,
    }),
    challengeProgress,
    challengePoints,
    latestDayKey: latest.dayKey,
  };
}
