import type { EnergySlot, RawEnergyInput } from "@/types/energy";

import {
  formatSlotLabel,
  parseTimestampInput,
  toDayKey,
  toLocalTimestamp,
} from "@/lib/energy/formatters";

export function normalizeUsage(records: RawEnergyInput[]) {
  const normalized: EnergySlot[] = records.map(({ timestamp, kwh }) => {
    if (!Number.isFinite(kwh) || kwh < 0) {
      throw new Error(`Invalid kWh value for timestamp "${timestamp}".`);
    }

    const date = parseTimestampInput(timestamp);
    const minute = date.getMinutes();

    if (minute !== 0 && minute !== 30) {
      throw new Error(
        `Timestamp "${timestamp}" is not aligned to a half-hour boundary.`,
      );
    }

    const localTimestamp = toLocalTimestamp(date);

    return {
      timestamp: localTimestamp,
      dayKey: toDayKey(date),
      label: formatSlotLabel(localTimestamp),
      kwh,
    };
  });

  return normalized.sort((left, right) =>
    left.timestamp.localeCompare(right.timestamp),
  );
}
