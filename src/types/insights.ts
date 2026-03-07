import type { DailyStats, EnergySlot } from "@/types/energy";
import type { OnboardingProfile } from "@/types/onboarding";

export type ApplianceName =
  | "cooling"
  | "heater"
  | "laundry"
  | "cooking"
  | "base_load";

export type ApplianceScore = {
  appliance: ApplianceName;
  score: number;
  confidence: number;
  reasons: string[];
};

export type AssistantMode =
  | "explain_spike"
  | "suggest_steps"
  | "likely_cause"
  | "estimate_savings";

export type ImpactMetricKey = "bill" | "carbon" | "peak";

export type ImpactMetricCard = {
  key: ImpactMetricKey;
  label: string;
  value: number | null;
  unit: string;
  description: string;
  benchmarkLabel?: string;
  benchmarkValue?: number | null;
};

export type ImpactComparisonDatum = {
  label: string;
  current: number | null;
  comparison: number | null;
  unit: string;
};

export type ImpactMetrics = {
  estimatedMonthlyBill: ImpactMetricCard;
  estimatedCo2: ImpactMetricCard;
  peakTimeShare: ImpactMetricCard;
  comparisonSeries: ImpactComparisonDatum[];
  /** Actual kWh summed from complete days in the current real-world calendar month. */
  currentMonthKwh: number | null;
};

export type ImpactComparisonScenario = {
  label: string;
  metricBenchmarks?: Partial<Record<ImpactMetricKey, number | null>>;
  series: ImpactComparisonDatum[];
};

export type InsightPayload = {
  mode: AssistantMode;
  slot: EnergySlot;
  dayStats: DailyStats;
  spikeScore: number;
  applianceScores: ApplianceScore[];
  reasonFacts: string[];
  actionTags: string[];
  profile: OnboardingProfile;
  userPriority: OnboardingProfile["priority"];
  impactMetrics?: ImpactMetrics | null;
};

export type AssistantApiResponse = {
  answer: string;
};
