import type { DailyStats, EnergySlot } from "@/types/energy";
import type { ApplianceScore, AssistantMode, ImpactMetrics, InsightPayload } from "@/types/insights";
import type { OnboardingProfile } from "@/types/onboarding";

export function buildInsightPayload(args: {
  mode: AssistantMode;
  slot: EnergySlot;
  dayStats: DailyStats;
  spikeScore: number;
  applianceScores: ApplianceScore[];
  reasonFacts: string[];
  actionTags: string[];
  profile: OnboardingProfile;
  impactMetrics?: ImpactMetrics | null;
}) {
  return {
    mode: args.mode,
    slot: args.slot,
    dayStats: args.dayStats,
    spikeScore: args.spikeScore,
    applianceScores: args.applianceScores,
    reasonFacts: args.reasonFacts,
    actionTags: args.actionTags,
    profile: args.profile,
    userPriority: args.profile.priority,
    impactMetrics: args.impactMetrics ?? null,
  } satisfies InsightPayload;
}
