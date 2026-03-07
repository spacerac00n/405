"use client";

import { useEffect, useMemo, useState } from "react";

import type { WeeklySummaryItem } from "@/types/energy";

type DayDropdownProps = {
  items: WeeklySummaryItem[];
  selectedDayKey: string | null;
  onSelect: (dayKey: string) => void;
};

export function DayDropdown({
  items,
  selectedDayKey,
  onSelect,
}: DayDropdownProps) {
  const monthGroups = useMemo(() => {
    const grouped = new Map<
      string,
      { key: string; label: string; days: WeeklySummaryItem[] }
    >();

    for (const item of items) {
      const key = item.dayKey.slice(0, 7);
      const existing = grouped.get(key);

      if (existing) {
        existing.days.push(item);
        continue;
      }

      const date = new Date(`${key}-01T00:00:00`);
      const label = new Intl.DateTimeFormat("en-SG", {
        month: "long",
        year: "numeric",
      }).format(date);

      grouped.set(key, {
        key,
        label,
        days: [item],
      });
    }

    return [...grouped.values()].sort((left, right) => left.key.localeCompare(right.key));
  }, [items]);

  const lastMonthKey = monthGroups[monthGroups.length - 1]?.key ?? "";
  const selectedDayMonthKey = selectedDayKey?.slice(0, 7) ?? "";
  const initialMonthKey =
    monthGroups.some((group) => group.key === selectedDayMonthKey)
      ? selectedDayMonthKey
      : lastMonthKey;
  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);

  useEffect(() => {
    const nextMonthKey =
      monthGroups.some((group) => group.key === selectedDayMonthKey)
        ? selectedDayMonthKey
        : lastMonthKey;

    if (nextMonthKey && nextMonthKey !== selectedMonthKey) {
      setSelectedMonthKey(nextMonthKey);
    }
  }, [lastMonthKey, monthGroups, selectedDayMonthKey, selectedMonthKey]);

  const activeMonth = monthGroups.find((group) => group.key === selectedMonthKey) ?? null;
  const filteredItems = activeMonth?.days ?? items;
  const selected = filteredItems.find((item) => item.dayKey === selectedDayKey) ?? null;

  if (!items.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/8 bg-white/[0.02] px-4 py-5 text-sm text-slate-500">
        No day options yet.
      </div>
    );
  }

  return (
    <div className="inline-flex min-w-[260px] flex-col gap-2">
      <label
        htmlFor="month-select"
        className="text-[11px] uppercase tracking-[0.24em] text-slate-500"
      >
        Month
      </label>
      <div className="relative rounded-[22px] border border-white/20 bg-white/[0.06] px-4 py-3 ring-1 ring-white/5 transition hover:border-white/30 hover:bg-white/[0.08]">
        <select
          id="month-select"
          value={selectedMonthKey}
          onChange={(event) => {
            const nextMonthKey = event.target.value;
            setSelectedMonthKey(nextMonthKey);
            const monthDays = monthGroups.find((group) => group.key === nextMonthKey)?.days ?? [];
            if (
              monthDays.length &&
              !monthDays.some((item) => item.dayKey === selectedDayKey)
            ) {
              onSelect(monthDays[monthDays.length - 1].dayKey);
            }
          }}
          className="w-full appearance-none bg-transparent pr-7 text-sm text-white outline-none"
        >
          {monthGroups.map((month) => (
            <option key={month.key} value={month.key} className="bg-slate-950 text-white">
              {month.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          &#8964;
        </span>
      </div>
      <label
        htmlFor="day-select"
        className="text-[11px] uppercase tracking-[0.24em] text-slate-500"
      >
        Day
      </label>
      <div className="relative rounded-[22px] border border-white/20 bg-white/[0.06] px-4 pt-3 pb-2.5 ring-1 ring-white/5 transition hover:border-white/30 hover:bg-white/[0.08]">
        <select
          id="day-select"
          value={selectedDayKey ?? filteredItems[0]?.dayKey ?? ""}
          onChange={(event) => onSelect(event.target.value)}
          className="w-full appearance-none bg-transparent pr-7 text-sm text-white outline-none"
        >
          {filteredItems.map((item) => (
            <option key={item.dayKey} value={item.dayKey} className="bg-slate-950 text-white">
              {item.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-3.5 text-slate-400">
          &#8964;
        </span>
        {selected && (
          <p className="pointer-events-none mt-0.5 text-[12px] text-slate-500">
            {selected.totalKwh.toFixed(1)} kWh today
          </p>
        )}
      </div>
    </div>
  );
}
