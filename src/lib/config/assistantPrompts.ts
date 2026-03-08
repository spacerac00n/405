import type { AssistantMode, InsightPayload } from "@/types/insights";

/**
 * Returns a plain-English description of when this user's aircon is plausible,
 * AND whether the selected slot falls inside or outside that window.
 */
function describeCoolingWindow(payload: InsightPayload): string {
  const { airconFrequency, airconWindow, airconDuration } = payload.profile;
  const hour = getSlotHour(payload);

  if (airconFrequency === "rarely") {
    return "Aircon: user rarely uses air conditioning, so it is very unlikely to be active in any slot.";
  }

  let windowDesc: string;
  let inWindow: boolean;

  if (airconFrequency === "day_and_night") {
    windowDesc = "all day and night";
    inWindow = true;
  } else if (airconWindow === "overnight" || airconDuration === "overnight") {
    windowDesc = "overnight (roughly 9 pm to 8 am)";
    inWindow = hour >= 21 || hour < 8;
  } else if (airconWindow === "evening") {
    if (airconDuration === "4-8h") {
      windowDesc = "evening to late night (roughly 3:30 pm to midnight)";
      inWindow = hour >= 15.5;
    } else {
      windowDesc = "evening (roughly 3:30 pm to 11 pm)";
      inWindow = hour >= 15.5 && hour < 23;
    }
  } else if (airconWindow === "afternoon") {
    windowDesc = "afternoon to early evening (roughly 12 pm to 6 pm)";
    inWindow = hour >= 12 && hour < 18;
  } else {
    // varies
    windowDesc = "varies — no fixed window";
    inWindow = true;
  }

  const verdict = inWindow
    ? `The selected slot is INSIDE this window — aircon is plausible here.`
    : `The selected slot is OUTSIDE this window — aircon is unlikely here.`;

  return `Aircon: user runs it ${airconFrequency.replace("_", " ")}, preferred window is ${windowDesc}. ${verdict}`;
}

/**
 * Returns a plain-English description of when this user's water heater is plausible,
 * AND whether the selected slot falls inside or outside that window.
 */
function describeHeaterWindow(payload: InsightPayload): string {
  const hour = getSlotHour(payload);
  const { showerWindow } = payload.profile;

  // Evening shower window ends at 22:00 — most households shower by 10 pm.
  const morningIn = hour >= 5.5 && hour < 9.5;
  const eveningIn = hour >= 17.0 && hour < 22.0;

  let windowDesc: string;
  let inWindow: boolean;

  if (showerWindow === "morning") {
    windowDesc = "morning (roughly 5:30 am to 9:30 am)";
    inWindow = morningIn;
  } else if (showerWindow === "evening") {
    windowDesc = "evening (roughly 5 pm to 10 pm)";
    inWindow = eveningIn;
  } else {
    // both
    windowDesc = "morning (5:30–9:30 am) and evening (5–10 pm)";
    inWindow = morningIn || eveningIn;
  }

  const verdict = inWindow
    ? `The selected slot is INSIDE this window — water heater is plausible here.`
    : `The selected slot is OUTSIDE this window — water heater is unlikely here.`;

  return `Water heater: user showers in ${windowDesc}. ${verdict}`;
}

/**
 * Returns a plain-English description of when this user's laundry is plausible,
 * AND whether the selected slot falls inside or outside that window.
 */
function describeLaundryWindow(payload: InsightPayload): string {
  const hour = getSlotHour(payload);
  const weekend = getSlotIsWeekend(payload);
  const { laundryWindow } = payload.profile;

  let windowDesc: string;
  let inWindow: boolean;

  if (laundryWindow === "morning") {
    windowDesc = "morning sessions (roughly 7 am to 12 pm)";
    inWindow = hour >= 7 && hour < 12;
  } else if (laundryWindow === "weekday_evening") {
    windowDesc = "weekday evenings (roughly 5 pm to 11 pm)";
    inWindow = !weekend && hour >= 17 && hour < 23;
  } else if (laundryWindow === "weekend") {
    windowDesc = "weekend daytime (roughly 9 am to 7 pm)";
    inWindow = weekend && hour >= 9 && hour < 19;
  } else {
    // varies
    windowDesc = "varies — flexible sessions during the day";
    inWindow = hour >= 7 && hour < 22;
  }

  const verdict = inWindow
    ? `The selected slot is INSIDE this window — laundry is plausible here.`
    : `The selected slot is OUTSIDE this window — laundry is unlikely here.`;

  return `Laundry: user typically does laundry in ${windowDesc}. ${verdict}`;
}

/** Extract the hour fraction (0–24) from the payload's selected slot timestamp. */
function getSlotHour(payload: InsightPayload): number {
  const ts = payload.slot.timestamp;
  try {
    const d = new Date(ts);
    return d.getHours() + d.getMinutes() / 60;
  } catch {
    return 12; // safe fallback
  }
}

/** Returns true if the selected slot falls on a weekend. */
function getSlotIsWeekend(payload: InsightPayload): boolean {
  try {
    const day = new Date(payload.slot.timestamp).getDay();
    return day === 0 || day === 6;
  } catch {
    return false;
  }
}

function buildHabitSummary(payload: InsightPayload) {
  return [
    `Aircon habits: frequency ${payload.profile.airconFrequency}, preferred window ${payload.profile.airconWindow}, duration ${payload.profile.airconDuration}.`,
    `Shower habits: ${payload.profile.showerWindow} showers, usually ${payload.profile.showerLength} length.`,
    `Laundry habits: ${payload.profile.laundryFrequency} times per week, usually ${payload.profile.laundryWindow}.`,
  ].join(" ");
}

export const assistantSystemPrompt =
  "You are a household energy insight assistant. Your job is to explain one selected half-hour slot using the user's onboarding habits as the ground truth for which appliances are active when. The ranked appliance scores already incorporate habit-based timing windows — trust them. Do not override the top-ranked appliance based on generic time-of-day reasoning. Only express uncertainty if the top two scores are very close. Do not invent appliance use outside the user's stated routine. Give one short paragraph only, in plain language, with no bullets, no markdown, no jargon, and no mention of scores, models, systems, or algorithms. Keep the answer believable, practical, user-friendly, and under 80 words.";

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
    `Appliance plausibility for this slot (derived from onboarding habits):`,
    `  ${describeCoolingWindow(payload)}`,
    `  ${describeHeaterWindow(payload)}`,
    `  ${describeLaundryWindow(payload)}`,
    `  Cooking is plausible only around meal times (breakfast ~7–9 am, lunch ~12–2 pm, dinner ~6–8 pm). Base load is always present as background demand but should not be described as an active appliance event.`,
    `Ranked appliance candidates (habit-weighted, window-gated): ${rankedScores}.`,
    `Reason facts: ${payload.reasonFacts.length ? payload.reasonFacts.join(" | ") : "none provided"}.`,
    `Action tags: ${payload.actionTags.length ? payload.actionTags.join(", ") : "none provided"}.`,
    `User priority: ${payload.userPriority}.`,
    `Impact context: ${impactSummary}.`,
    `Main contributor displayed to user: "${payload.applianceScores[0]?.appliance ?? "unknown"}". This is derived from habit-weighted scoring that already gates each appliance to its onboarding window. Treat it as the authoritative answer. Only express uncertainty if the second-ranked score is within 0.05 of the top score.`,
    "Interpretation rules: (1) The scored ranking reflects the user's stated habits — do not override it. (2) Appliances marked OUTSIDE their window above should not be mentioned as likely. (3) Appliances marked INSIDE their window and ranked first should be named confidently. (4) Only hedge with 'likely' or 'possible' when two appliances are both in-window and nearly equal in score.",
    "Writing rules: return one short paragraph only, in plain English, around 35 to 70 words when possible. No bullets, no markdown, no jargon, no raw JSON-like phrasing, and no mention of model, score, algorithm, or system.",
    "Recommendation rule: if suggesting action, give one or two simple steps tied to the likely cause, explain why they help, and state the likely benefit in everyday language.",
  ].join("\n");
}
