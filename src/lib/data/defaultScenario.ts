import type { RawEnergyInput } from "@/types/energy";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function buildHalfHourlyKwh(date: Date) {
  const hour = date.getHours() + date.getMinutes() / 60;
  const weekday = date.getDay();
  const monthIndex = date.getMonth();

  const nightBase = hour < 6 ? 0.2 : 0;
  const morningBase = hour >= 6 && hour < 9 ? 0.26 : 0;
  const dayBase = hour >= 9 && hour < 17 ? 0.24 : 0;
  const eveningBase = hour >= 17 && hour < 23 ? 0.56 : 0;
  const lateBase = hour >= 23 ? 0.28 : 0;

  const weekendBoost = weekday === 0 || weekday === 6 ? 0.08 : 0;
  const monthBoost = monthIndex * 0.03;
  const sinusoidal = 0.06 * Math.sin((hour / 24) * Math.PI * 2);
  const halfHourPulse = date.getMinutes() === 30 ? 0.016 : -0.01;

  const raw =
    0.16 +
    nightBase +
    morningBase +
    dayBase +
    eveningBase +
    lateBase +
    weekendBoost +
    monthBoost +
    sinusoidal +
    halfHourPulse;

  return Math.max(0.12, Math.min(1.55, raw));
}

function buildTimestamp(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildScenario(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const slots: RawEnergyInput[] = [];

  for (
    let current = new Date(start);
    current <= end;
    current = new Date(current.getTime() + 30 * 60 * 1000)
  ) {
    slots.push({
      timestamp: buildTimestamp(current),
      kwh: Number(buildHalfHourlyKwh(current).toFixed(2)),
    });
  }

  return slots;
}

export const defaultScenarioMeta = {
  name: "Internal mock dataset",
  description: "Two months of half-hour household usage for the AI Energy Coach demo.",
};

export const defaultScenario = buildScenario(
  "2026-01-01T00:00:00",
  "2026-02-28T23:30:00",
);
