import { round } from "@/lib/utils";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function parseTimestampInput(input: string) {
  const trimmed = input.trim();
  const parsed = new Date(trimmed.length === 16 ? `${trimmed}:00` : trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid timestamp "${input}".`);
  }

  return parsed;
}

export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toLocalTimestamp(date: Date) {
  return `${toDayKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatShortDayLabel(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

export function formatSlotLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parseTimestampInput(timestamp));
}

export function formatKwh(value: number | null, digits = 2) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${round(value, digits).toFixed(digits)} kWh`;
}

export function formatPercent(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${round(value * 100, digits).toFixed(digits)}%`;
}

export function formatCompactNumber(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return round(value, digits).toFixed(digits);
}

export function formatCurrency(
  value: number | null,
  currencyLabel: string,
  digits = 0,
) {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }

  return `${currencyLabel}${round(value, digits).toFixed(digits)}`;
}

export function getHourFraction(timestamp: string) {
  const date = parseTimestampInput(timestamp);
  return date.getHours() + date.getMinutes() / 60;
}

export function isWeekend(timestamp: string) {
  const date = parseTimestampInput(timestamp);
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isWithinWindow(
  hourFraction: number,
  startHour: number,
  endHour: number,
) {
  if (startHour <= endHour) {
    return hourFraction >= startHour && hourFraction < endHour;
  }

  return hourFraction >= startHour || hourFraction < endHour;
}
