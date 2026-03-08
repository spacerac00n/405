"use client";

import { useEffect, useState, useTransition } from "react";

import { defaultScenario, defaultScenarioMeta } from "@/lib/data/defaultScenario";
import { buildActionTags } from "@/lib/energy/buildActionTags";
import { buildInsightPayload } from "@/lib/energy/buildInsightPayload";
import { buildReasonFacts } from "@/lib/energy/buildReasonFacts";
import { calculateDailyStats } from "@/lib/energy/calculateDailyStats";
import { detectSpikes } from "@/lib/energy/detectSpikes";
import { estimateImpact } from "@/lib/energy/estimateImpact";
import { formatShortDayLabel } from "@/lib/energy/formatters";
import { groupByDay } from "@/lib/energy/groupByDay";
import { inferApplianceScores } from "@/lib/energy/inferApplianceScores";
import { normalizeUsage } from "@/lib/energy/normalizeUsage";
import { parseCsvFile } from "@/lib/energy/parseCsv";
import { buildHabitInsights } from "@/lib/energy/buildHabitInsights";
import type { DatasetOrigin, DayEnergySeries, EnergySlot, WeeklySummaryItem } from "@/types/energy";
import type { EnergyChallenge } from "@/types/habits";
import type { AssistantApiResponse, AssistantMode } from "@/types/insights";
import {
  defaultOnboardingProfile,
  type OnboardingProfile,
} from "@/types/onboarding";

const storageKey = "ai-energy-coach:profile";
const defaultChallenges: EnergyChallenge[] = [
  {
    key: "lower_daily_usage",
    title: "Lower Daily Usage",
    description: "Keep total daily energy lower than your recent baseline.",
    durationDays: 7 as const,
  },
  {
    key: "efficient_evening_usage",
    title: "Efficient Evening Usage",
    description: "Use less energy during evening peak hours.",
    durationDays: 7 as const,
  },
  {
    key: "smart_aircon_usage",
    title: "Smart Aircon Usage",
    description: "Keep overnight cooling stable without heavy spikes.",
    durationDays: 7 as const,
  },
];

function loadPlaceholderState() {
  if (!defaultScenario.length) {
    return {
      slots: [] as EnergySlot[],
      error: null as string | null,
    };
  }

  try {
    const normalized = normalizeUsage(defaultScenario);
    const grouped = groupByDay(normalized);

    if (!grouped.length) {
      return {
        slots: [] as EnergySlot[],
        error:
          "The internal placeholder dataset is present, but it does not contain any complete 48-slot days yet.",
      };
    }

    return {
      slots: normalized,
      error: null as string | null,
    };
  } catch (error) {
    return {
      slots: [] as EnergySlot[],
      error:
        error instanceof Error
          ? error.message
          : "The internal placeholder dataset could not be loaded.",
    };
  }
}

function getDefaultDay(daySeries: DayEnergySeries[]) {
  return [...daySeries].sort((left, right) => right.totalKwh - left.totalKwh)[0] ?? null;
}

function getDefaultSlot(day: DayEnergySeries) {
  const spikes = detectSpikes(day.slots).sort((left, right) => right.spikeScore - left.spikeScore);
  const topSpike = spikes[0];

  if (topSpike) {
    return day.slots.find((slot) => slot.timestamp === topSpike.timestamp) ?? day.slots[0] ?? null;
  }

  return [...day.slots].sort((left, right) => right.kwh - left.kwh)[0] ?? null;
}

function buildWeeklySummary(daySeries: DayEnergySeries[]) {
  return daySeries.map((series) => {
    const spikes = detectSpikes(series.slots);

    return {
      dayKey: series.dayKey,
      label: series.label,
      shortLabel: formatShortDayLabel(series.dayKey),
      totalKwh: series.totalKwh,
      averageKwh: series.averageKwh,
      peakKwh: series.peakKwh,
      spikeCount: spikes.filter((item) => item.isSpike).length,
      complete: series.slots.length === 48,
    } satisfies WeeklySummaryItem;
  });
}

export function useEnergyDashboard() {
  const placeholderState = loadPlaceholderState();
  const [profile, setProfile] = useState<OnboardingProfile>(defaultOnboardingProfile);
  const [challenges] = useState<EnergyChallenge[]>(defaultChallenges);
  const [onboardingOpen, setOnboardingOpen] = useState(true);
  const [datasetOrigin, setDatasetOrigin] = useState<DatasetOrigin>("placeholder");
  const [datasetLabel, setDatasetLabel] = useState(defaultScenarioMeta.name);
  const [activeSlots, setActiveSlots] = useState<EnergySlot[]>(placeholderState.slots);
  const [csvError, setCsvError] = useState<string | null>(placeholderState.error);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedSlotTimestamp, setSelectedSlotTimestamp] = useState<string | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantMode, setAssistantMode] = useState<AssistantMode | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as OnboardingProfile;
      setProfile(parsed);
      setOnboardingOpen(false);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  const completeDaySeries = groupByDay(activeSlots);
  const daySeries = completeDaySeries;
  const weeklySummary = buildWeeklySummary(daySeries);

  useEffect(() => {
    if (!daySeries.length) {
      setSelectedDayKey(null);
      setSelectedSlotTimestamp(null);
      return;
    }

    const hasSelected = daySeries.some((series) => series.dayKey === selectedDayKey);

    if (!hasSelected) {
      const defaultDay = getDefaultDay(daySeries);
      setSelectedDayKey(defaultDay?.dayKey ?? null);
    }
  }, [daySeries, selectedDayKey]);

  const selectedDay =
    daySeries.find((series) => series.dayKey === selectedDayKey) ?? null;
  const selectedSpikes = selectedDay ? detectSpikes(selectedDay.slots) : [];

  useEffect(() => {
    if (!selectedDay) {
      setSelectedSlotTimestamp(null);
      return;
    }

    const hasSlot = selectedDay.slots.some(
      (slot) => slot.timestamp === selectedSlotTimestamp,
    );

    if (!hasSlot) {
      const defaultSlot = getDefaultSlot(selectedDay);
      startTransition(() => {
        setSelectedSlotTimestamp(defaultSlot?.timestamp ?? null);
      });
    }
  }, [selectedDay, selectedSlotTimestamp, startTransition]);

  const selectedSlot =
    selectedDay?.slots.find((slot) => slot.timestamp === selectedSlotTimestamp) ?? null;
  const selectedSpike =
    selectedSpikes.find((spike) => spike.timestamp === selectedSlotTimestamp) ?? null;
  const dayStats = selectedDay ? calculateDailyStats(selectedDay.slots) : null;
  const applianceScores =
    selectedSlot && selectedDay
      ? inferApplianceScores(selectedSlot, selectedDay.slots, profile)
      : [];
  const reasonFacts =
    selectedSlot && dayStats
      ? buildReasonFacts(
          selectedSlot,
          dayStats,
          applianceScores,
          selectedSpike?.spikeScore ?? 0,
        )
      : [];
  const actionTags = buildActionTags(applianceScores, profile);
  const impactMetrics = estimateImpact(completeDaySeries);
  const habitInsights = buildHabitInsights(completeDaySeries, challenges);

  function completeOnboarding(nextProfile: OnboardingProfile) {
    setProfile(nextProfile);
    setOnboardingOpen(false);
    window.localStorage.setItem(storageKey, JSON.stringify(nextProfile));
  }

  function reopenOnboarding() {
    setOnboardingOpen(true);
  }

  function dismissOnboarding() {
    setOnboardingOpen(false);
  }

  function selectDay(dayKey: string) {
    startTransition(() => {
      setSelectedDayKey(dayKey);
    });
  }

  function selectSlot(timestamp: string) {
    setSelectedSlotTimestamp(timestamp);
  }

  async function handleCsvUpload(file: File) {
    setCsvError(null);

    try {
      const records = await parseCsvFile(file);
      const normalized = normalizeUsage(records);
      const grouped = groupByDay(normalized);

      if (!grouped.length) {
        throw new Error(
          "No complete 48-slot days were found. Upload full half-hourly days to continue.",
        );
      }

      setActiveSlots(normalized);
      setDatasetOrigin("csv");
      setDatasetLabel(file.name);
      setAssistantError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to parse that CSV. Check the headers and values.";
      setCsvError(message);
    }
  }

  async function requestAssistant(mode: AssistantMode) {
    if (!selectedSlot || !selectedDay || !dayStats) {
      setAssistantError("Choose a complete day and half-hour slot before requesting an insight.");
      return;
    }

    const payload = buildInsightPayload({
      mode,
      slot: selectedSlot,
      dayStats,
      spikeScore: selectedSpike?.spikeScore ?? 0,
      applianceScores,
      reasonFacts,
      actionTags,
      profile,
      impactMetrics,
    });

    setAssistantMode(mode);
    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Partial<AssistantApiResponse> & {
        error?: string;
      };

      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "The assistant could not generate a response.");
      }

      setAssistantAnswer(data.answer);
    } catch (error) {
      setAssistantError(
        error instanceof Error
          ? error.message
          : "The assistant could not generate a response.",
      );
    } finally {
      setAssistantLoading(false);
    }
  }

  return {
    profile,
    allDays: daySeries,
    challenges,
    onboardingOpen,
    datasetOrigin,
    datasetLabel,
    csvError,
    weeklySummary,
    selectedDay,
    selectedSlot,
    selectedSpikes,
    selectedSpike,
    dayStats,
    applianceScores,
    reasonFacts,
    actionTags,
    impactMetrics,
    habitInsights,
    assistantLoading,
    assistantAnswer,
    assistantError,
    assistantMode,
    hasData: daySeries.length > 0,
    completeOnboarding,
    reopenOnboarding,
    dismissOnboarding,
    selectDay,
    selectSlot,
    handleCsvUpload,
    requestAssistant,
  };
}
