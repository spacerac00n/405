"use client";

import type { WeeklySummaryItem } from "@/types/energy";

import { cn } from "@/lib/utils";

// SP Group regulated household rate (Q1 2026)
const RATE_PER_KWH = 0.2911;

type MonthlyUsageChartProps = {
  items: WeeklySummaryItem[];
  selectedDayKey: string | null;
  /** Controlled active month (YYYY-MM). Managed by the parent so other panels stay in sync. */
  activeMonthKey: string | null;
  onMonthChange: (monthKey: string) => void;
  onSelectDay: (dayKey: string) => void;
};

type MonthGroup = {
  monthKey: string;      // "YYYY-MM"
  label: string;         // "Mar 2026"
  days: WeeklySummaryItem[];
};

function toMonthKey(dayKey: string) {
  return dayKey.slice(0, 7); // "YYYY-MM"
}

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00`);
  return new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric" }).format(date);
}

function formatShortDate(dayKey: string) {
  const date = new Date(`${dayKey}T00:00:00`);
  return new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short" }).format(date);
}

function buildMonthGroups(items: WeeklySummaryItem[]): MonthGroup[] {
  const map = new Map<string, WeeklySummaryItem[]>();
  for (const item of items) {
    const mk = toMonthKey(item.dayKey);
    const existing = map.get(mk) ?? [];
    existing.push(item);
    map.set(mk, existing);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, days]) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      days: days.sort((a, b) => a.dayKey.localeCompare(b.dayKey)),
    }));
}

export function MonthlyUsageChart({
  items,
  selectedDayKey,
  activeMonthKey: controlledMonthKey,
  onMonthChange,
  onSelectDay,
}: MonthlyUsageChartProps) {
  const groups = buildMonthGroups(items);

  // Fall back to the month containing the selected day, or the last available month.
  const defaultMonthKey =
    (selectedDayKey ? toMonthKey(selectedDayKey) : null) ??
    groups[groups.length - 1]?.monthKey ??
    "";
  const resolvedMonthKey = controlledMonthKey ?? defaultMonthKey;
  const activeGroup = groups.find((g) => g.monthKey === resolvedMonthKey) ?? groups[0];

  if (!activeGroup) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/8 bg-white/2 px-6 py-12 text-center text-sm text-slate-500">
        No data available yet.
      </div>
    );
  }

  const { days } = activeGroup;
  const totalKwh = days.reduce((sum, d) => sum + d.totalKwh, 0);
  const avgKwh = totalKwh / days.length;
  const peakDay = days.reduce((best, d) => (d.totalKwh > best.totalKwh ? d : best), days[0]);
  const estimatedCost = totalKwh * RATE_PER_KWH;
  const maxKwh = Math.max(...days.map((d) => d.totalKwh), 0.01);

  return (
    <div className="space-y-4 rounded-[30px] border border-white/6 bg-white/2.5 p-5">
      {/* ── Header stats ─────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Monthly overview
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Total&nbsp;
            <span className="font-semibold text-white">{totalKwh.toFixed(1)} kWh</span>
            &nbsp;·&nbsp;Est.&nbsp;
            <span className="font-semibold text-white">${estimatedCost.toFixed(2)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-right text-xs">
          <div>
            <p className="uppercase tracking-[0.2em] text-slate-500">Avg / day</p>
            <p className="font-medium text-white">{avgKwh.toFixed(1)} kWh</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.2em] text-slate-500">Peak day</p>
            <p className="font-medium text-white">{formatShortDate(peakDay.dayKey)}</p>
          </div>
        </div>
      </div>

      {/* ── Month selector (only shown when data spans multiple months) ── */}
      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.monthKey}
              type="button"
              onClick={() => onMonthChange(g.monthKey)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                g.monthKey === resolvedMonthKey
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300"
                  : "border-white/10 bg-white/4 text-slate-400 hover:border-white/20 hover:text-slate-200",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Bar chart ────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${Math.max(days.length * 28, 320)}px` }}>
          <div
            className="grid h-48 items-end gap-1.5 rounded-[20px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] px-4 pb-4 pt-4"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day) => {
              const isSelected = day.dayKey === selectedDayKey;
              const isPeak = day.dayKey === peakDay.dayKey;
              const heightPct = Math.max(6, (day.totalKwh / maxKwh) * 100);

              return (
                <button
                  key={day.dayKey}
                  type="button"
                  onClick={() => onSelectDay(day.dayKey)}
                  title={`${formatShortDate(day.dayKey)}: ${day.totalKwh.toFixed(2)} kWh`}
                  className="group relative flex h-full items-end focus:outline-none"
                  aria-label={`${day.label}, ${day.totalKwh.toFixed(2)} kWh`}
                >
                  <span
                    className={cn(
                      "relative w-full rounded-full transition duration-200 group-hover:brightness-125",
                      isSelected
                        ? "bg-[linear-gradient(180deg,rgba(255,184,95,0.96),rgba(255,184,95,0.28))] shadow-[0_0_20px_rgba(255,184,95,0.28)]"
                        : isPeak && !isSelected
                          ? "bg-[linear-gradient(180deg,rgba(139,231,143,0.92),rgba(83,212,255,0.18))]"
                          : "bg-[linear-gradient(180deg,rgba(83,212,255,0.9),rgba(83,212,255,0.18))]",
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </button>
              );
            })}
          </div>

          {/* ── Date labels ──────────────────────────── */}
          <div
            className="mt-2 grid text-[10px] uppercase tracking-[0.16em] text-slate-600"
            style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
          >
            {days.map((day, i) => {
              // Show label for first, last, and every ~7th bar
              const show = i === 0 || i === days.length - 1 || i % 7 === 0;
              return (
                <span
                  key={day.dayKey}
                  className={cn("truncate", !show && "invisible")}
                >
                  {new Date(`${day.dayKey}T00:00:00`).getDate()}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(83,212,255,0.8)]" />
          Daily usage
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(139,231,143,0.85)]" />
          Peak day
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[rgba(255,184,95,0.9)]" />
          Selected day
        </span>
      </div>
    </div>
  );
}
