export type ChallengeKey =
  | "lower_daily_usage"
  | "efficient_evening_usage"
  | "smart_aircon_usage";

export type EnergyChallenge = {
  key: ChallengeKey;
  title: string;
  description: string;
  durationDays: 7;
};

export type ChallengeProgress = {
  key: ChallengeKey;
  title: string;
  durationDays: 7;
  completedDays: number;
  progress: number;
  metToday: boolean;
};

export type ChallengePointSummary = {
  key: ChallengeKey;
  title: string;
  weeklyPoints: number;
  cumulativePoints: number;
  completedThisWeek: boolean;
};

export type HabitInsights = {
  efficiencyScore: number;
  streakDays: number;
  longestStreak: number;
  rewardPoints: number;
  weeklyPoints: number;
  activeChallengeCount: number;
  dailyInsight: string;
  challengeProgress: ChallengeProgress[];
  challengePoints: ChallengePointSummary[];
  latestDayKey: string | null;
};
