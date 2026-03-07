import type { AssistantMode, InsightPayload } from "@/types/insights";

function describeCoolingWindow(payload: InsightPayload) {
  const { airconFrequency, airconWindow, airconDuration } = payload.profile;

  if (airconWindow === "overnight" || airconDuration === "overnight") {
    return "Air con is most believable overnight, roughly 10 pm to 7 or 8 am, unless other evidence clearly points elsewhere.";
  }

  if (airconWindow === "evening") {
    return airconDuration === "4-8h"
      ? "Air con is most believable from the evening into late night, roughly 7 pm to 1 am."
      : "Air con is most believable in the evening, roughly 6 pm to 11 pm.";
  }

  if (airconWindow === "afternoon") {
    return "Air con is most believable in the hotter afternoon to early evening window, roughly 1 pm to 7 pm.";
  }

  if (airconFrequency === "day_and_night") {
    return "Air con may appear in both daytime and nighttime windows, but still should be tied to believable occupied periods rather than assumed all day.";
  }

  return "Air con should be tied to the user's stated aircon window and duration, not assumed across the whole day.";
}

function describeHeaterWindow(payload: InsightPayload) {
  if (payload.profile.showerWindow === "both") {
    return "Heater is most believable around shower periods: morning roughly 6 am to 9 am and evening roughly 7 pm to 11 pm.";
  }

  if (payload.profile.showerWindow === "morning") {
    return "Heater is most believable in the morning shower period, roughly 6 am to 9 am.";
  }

  return "Heater is most believable in the evening shower period, roughly 7 pm to 11 pm.";
}

function describeLaundryWindow(payload: InsightPayload) {
  if (payload.profile.laundryWindow === "weekday_evening") {
    return "Laundry is most believable as specific weekday evening sessions, roughly 7 pm to 11 pm, not as continuous use all day.";
  }

  if (payload.profile.laundryWindow === "weekend") {
    return "Laundry is most believable as weekend daytime sessions, roughly 9 am to 6 pm, rather than a constant daily pattern.";
  }

  if (payload.profile.laundryWindow === "morning") {
    return "Laundry is most believable in morning sessions, roughly 7 am to 12 pm.";
  }

  return "Laundry should be treated as one-off sessions in the stated preferred window, not as a whole-day appliance.";
}

function buildHabitSummary(payload: InsightPayload) {
  return [
    `Aircon habits: frequency ${payload.profile.airconFrequency}, preferred window ${payload.profile.airconWindow}, duration ${payload.profile.airconDuration}.`,
    `Shower habits: ${payload.profile.showerWindow} showers, usually ${payload.profile.showerLength} length.`,
    `Laundry habits: ${payload.profile.laundryFrequency} times per week, usually ${payload.profile.laundryWindow}.`,
  ].join(" ");
}

export const assistantSystemPrompt =
  "You are a careful household energy insight assistant. Interpret one selected half-hour slot by combining the user's onboarding habits, the time of day, the day's usage context, and the ranked appliance candidates. Prioritize plausibility over raw ranking. Do not invent all-day appliance use. Do not confidently name an appliance when the timing does not fit the user's routine. Prefer likely or possible when evidence is mixed. Air con should usually follow the user's stated aircon hours, heater should usually follow shower periods, laundry should usually appear as specific sessions, cooking should usually cluster around meal times, and base load should be described as background demand rather than active use. Give one short paragraph only, in plain language, with no bullets, no markdown, no jargon, and no mention of scores, models, systems, or algorithms. Keep the answer believable, practical, user-friendly, and under 80 words.";

export const assistantModeDirectives: Record<AssistantMode, string> = {
  explain_spike:
    "Explain why this half-hour slot looks elevated versus the rest of the day.",
  suggest_steps:
    "Suggest the most practical next steps based on the likely contributors and the user's priority.",
  likely_cause:
    "Name the most likely contributors and describe the confidence carefully.",
  estimate_savings:
    "Give a cautious estimate of where savings may come from without claiming exact appliance truth.",
};

export function buildAssistantPrompt(payload: InsightPayload) {
  const slotVsAverage = payload.slot.kwh - payload.dayStats.averageKwh;
  const slotVsMax = payload.dayStats.maxKwh - payload.slot.kwh;
  const slotVsAveragePct =
    payload.dayStats.averageKwh > 0
      ? (slotVsAverage / payload.dayStats.averageKwh) * 100
      : 0;

  const rankedScores = payload.applianceScores
    .slice(0, 3)
    .map(
      ({ appliance, score, confidence, reasons }, index) =>
        `${index + 1}. ${appliance}: score ${score.toFixed(2)}, confidence ${confidence.toFixed(
          2,
        )}, reasons: ${reasons.length ? reasons.join(" | ") : "none provided"}`,
    )
    .join("; ");

  const impactSummary = payload.impactMetrics
    ? [
        `Monthly bill: ${payload.impactMetrics.estimatedMonthlyBill.value ?? "n/a"} ${
          payload.impactMetrics.estimatedMonthlyBill.unit
        }`,
        `CO2: ${payload.impactMetrics.estimatedCo2.value ?? "n/a"} ${
          payload.impactMetrics.estimatedCo2.unit
        }`,
        `Peak share: ${payload.impactMetrics.peakTimeShare.value ?? "n/a"} ${
          payload.impactMetrics.peakTimeShare.unit
        }`,
      ].join(" | ")
    : "Impact metrics unavailable.";

  return [
    `Mode directive: ${assistantModeDirectives[payload.mode]}`,
    `Selected time slot: ${payload.slot.timestamp} (${payload.slot.label}), ${payload.slot.kwh.toFixed(2)} kWh.`,
    `Day context: average ${payload.dayStats.averageKwh.toFixed(2)} kWh, max ${payload.dayStats.maxKwh.toFixed(2)} kWh, this slot is ${slotVsAverage >= 0 ? "above" : "below"} average by ${Math.abs(slotVsAverage).toFixed(2)} kWh (${Math.abs(slotVsAveragePct).toFixed(0)}%), and ${slotVsMax.toFixed(2)} kWh below the day's maximum.`,
    `Spike score: ${payload.spikeScore.toFixed(2)}.`,
    `Onboarding habits: ${buildHabitSummary(payload)}`,
    `Time-window plausibility: ${describeCoolingWindow(payload)} ${describeHeaterWindow(payload)} ${describeLaundryWindow(payload)} Cooking is most believable around meal windows such as breakfast, lunch, or dinner. Base load is always possible as background demand but should not be described like an active appliance event.`,
    `Ranked appliance candidates: ${rankedScores}.`,
    `Reason facts: ${payload.reasonFacts.length ? payload.reasonFacts.join(" | ") : "none provided"}.`,
    `Action tags: ${payload.actionTags.length ? payload.actionTags.join(", ") : "none provided"}.`,
    `User priority: ${payload.userPriority}.`,
    `Impact context: ${impactSummary}.`,
    "Interpretation guidance: use onboarding habits as the main prior. Then test whether each top-ranked appliance is believable for this exact half-hour. Rank likely causes using both evidence and plausibility for the time window.",
    "Plausibility rules: do not assume an appliance runs all day unless the evidence strongly supports it. If the top-ranked appliance conflicts with the user's stated routine, say the cause is mixed, possible, or uncertain instead of forcing a confident claim.",
    "Decision rule: rank causes by both evidence and plausibility for this time window. If the highest-ranked appliance does not fit the time window well, say the cause is likely mixed or only possible rather than sounding certain.",
    "Writing rules: return one short paragraph only, in plain English, around 35 to 70 words when possible. No bullets, no markdown, no jargon, no raw JSON-like phrasing, and no mention of model, score, algorithm, or system.",
    "Recommendation rule: if suggesting action, give one or two simple steps tied to the likely cause, explain why they help, and state the likely benefit in everyday language.",
  ].join("\n");
}
