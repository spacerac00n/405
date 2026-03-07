import type { ApplianceScore } from "@/types/insights";
import type { OnboardingProfile } from "@/types/onboarding";

export function buildActionTags(
  applianceScores: ApplianceScore[],
  profile: OnboardingProfile,
) {
  const tags = new Set<string>();
  const top = applianceScores[0];

  if (!top) {
    return [];
  }

  if (top.appliance === "cooling") {
    tags.add("Shift aircon start later");
    tags.add("Raise setpoint slightly");
  }

  if (top.appliance === "heater") {
    tags.add("Shorten heater runtime");
    tags.add("Group showers closer together");
  }

  if (top.appliance === "laundry") {
    tags.add("Shift laundry to off-peak");
    tags.add("Batch laundry loads");
  }

  if (top.appliance === "cooking") {
    tags.add("Combine cooking tasks");
    tags.add("Pre-plan high-heat appliances");
  }

  if (top.appliance === "base_load") {
    tags.add("Check always-on devices");
    tags.add("Trim standby load overnight");
  }

  if (profile.priority === "bill") {
    tags.add("Prioritise lowest-cost hour shifts");
  }

  if (profile.priority === "carbon") {
    tags.add("Aim to smooth evening peaks");
  }

  if (profile.priority === "peak") {
    tags.add("Reduce clustered evening usage");
  }

  if (profile.priority === "all") {
    tags.add("Start with the biggest recurring routine");
  }

  return [...tags].slice(0, 4);
}
