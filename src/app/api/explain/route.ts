import { NextResponse } from "next/server";

import { buildAssistantPrompt, assistantSystemPrompt } from "@/lib/config/assistantPrompts";
import type { ApplianceName, AssistantMode, InsightPayload } from "@/types/insights";

const assistantModes = new Set<AssistantMode>([
  "explain_spike",
  "suggest_steps",
  "likely_cause",
  "estimate_savings",
]);

const applianceNames = new Set<ApplianceName>([
  "cooling",
  "heater",
  "laundry",
  "cooking",
  "base_load",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isInsightPayload(value: unknown): value is InsightPayload {
  if (!isObject(value)) {
    return false;
  }

  if (!assistantModes.has(value.mode as AssistantMode)) {
    return false;
  }

  if (!isObject(value.slot) || typeof value.slot.timestamp !== "string") {
    return false;
  }

  if (
    !isObject(value.dayStats) ||
    typeof value.dayStats.averageKwh !== "number" ||
    typeof value.dayStats.maxKwh !== "number"
  ) {
    return false;
  }

  if (!Array.isArray(value.applianceScores) || !Array.isArray(value.reasonFacts) || !Array.isArray(value.actionTags)) {
    return false;
  }

  for (const item of value.applianceScores) {
    if (
      !isObject(item) ||
      !applianceNames.has(item.appliance as ApplianceName) ||
      typeof item.score !== "number" ||
      typeof item.confidence !== "number" ||
      !Array.isArray(item.reasons)
    ) {
      return false;
    }
  }

  if (!isObject(value.profile)) {
    return false;
  }

  return (
    typeof value.userPriority === "string" &&
    typeof value.spikeScore === "number" &&
    typeof value.profile.priority === "string" &&
    typeof value.profile.airconFrequency === "string" &&
    typeof value.profile.airconWindow === "string" &&
    typeof value.profile.airconDuration === "string" &&
    typeof value.profile.showerWindow === "string" &&
    typeof value.profile.showerLength === "string" &&
    typeof value.profile.laundryFrequency === "string" &&
    typeof value.profile.laundryWindow === "string"
  );
}

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];

  for (const item of output) {
    if (!isObject(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isObject(content) && typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return null;
}

function trimToWordLimit(text: string, limit = 80) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");

  if (words.length <= limit) {
    return words.join(" ");
  }

  return `${words.slice(0, limit).join(" ")}…`;
}

function buildFallbackAnswer(payload: InsightPayload) {
  const top = payload.applianceScores[0];
  const leadReason = payload.reasonFacts[0] ?? "This slot stands above the daily baseline.";
  const firstAction = payload.actionTags[0];

  if (!top) {
    return "I need a selected slot with ranked contributors before I can explain the pattern.";
  }

  const applianceLabel =
    top.appliance === "base_load"
      ? "background household load"
      : top.appliance === "cooling"
        ? "cooling"
        : top.appliance === "heater"
          ? "shower heating"
          : top.appliance === "laundry"
            ? "laundry"
            : "cooking";

  const responses: Record<AssistantMode, string> = {
    explain_spike: `This half-hour likely rose because ${applianceLabel} ranks highest for this time window. ${leadReason}`,
    suggest_steps: `The strongest likely contributor is ${applianceLabel}. ${firstAction ? `${firstAction}.` : ""} Start there and see whether the next similar slot softens.`,
    likely_cause: `The most likely contributor is ${applianceLabel}, based on timing, your onboarding habits, and how far this slot sits above the daily baseline.`,
    estimate_savings: `The clearest savings opportunity likely sits in ${applianceLabel}. ${firstAction ? `${firstAction}.` : ""} Treat it as a probable lever, not exact appliance truth.`,
  };

  return trimToWordLimit(responses[payload.mode]);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!isInsightPayload(body)) {
    return NextResponse.json(
      { error: "Invalid insight payload." },
      { status: 400 },
    );
  }

  const prompt = buildAssistantPrompt(body);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ answer: buildFallbackAnswer(body) });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions: assistantSystemPrompt,
        input: prompt,
      }),
    });

    const payload = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(
        typeof payload.error === "object" && payload.error && "message" in payload.error
          ? String((payload.error as { message?: unknown }).message)
          : "OpenAI request failed.",
      );
    }

    const answer = extractResponseText(payload);

    if (!answer) {
      throw new Error("OpenAI returned an empty response.");
    }

    return NextResponse.json({ answer: trimToWordLimit(answer) });
  } catch {
    return NextResponse.json({ answer: buildFallbackAnswer(body) });
  }
}
