"use client";

import { useState } from "react";

import type { ImpactMetrics } from "@/types/insights";

import { Card } from "@/components/shared/Card";
import { cn } from "@/lib/utils";

// SP Group regulated household Electricity cost (Q1 2026)
const ELECTRICITY_INCL_GST = 0.2911; // S$/kWh
const CO2_KG_PER_KWH = 0.4085;  // Singapore grid emission factor (EMA 2023)

const GAP_TIPS = [
  "Raise your aircon by 1\u20132\u00b0C in the evening \u2014 you'll barely feel the difference.",
  "Shift laundry to off-peak hours, like before 9\u00a0am or after 10\u00a0pm.",
  "Avoid running the heater and aircon at the same time.",
  "Switch off standby devices at the wall overnight.",
  "Shorten shower time by 2\u20133 minutes where possible.",
];


function fmtDollar(value: number) {
  return `$${value.toFixed(2)}`;
}

function fmtKwh(value: number) {
  return `${Math.round(value)} kWh`;
}

function StatBlock({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p
        className={cn(
          "text-2xl font-semibold leading-tight",
          accent ? "text-emerald-400" : "text-white",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[12px] text-slate-500">{sub}</p>}
    </div>
  );
}

function ImpactCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/7 bg-white/3 p-5 space-y-2">
      <p className="text-2xl leading-none">{icon}</p>
      <p className="text-[13px] font-medium text-white">{title}</p>
      <p className="text-[13px] text-slate-400 leading-relaxed">{body}</p>
    </div>
  );
}

type ExploreTabProps = {
  impactMetrics: ImpactMetrics;
};

export function ExploreTab({ impactMetrics }: ExploreTabProps) {
  const [reduction, setReduction] = useState<number>(10);
  const [howOpen, setHowOpen] = useState(false);

  // Exact thumb-center: thumb travels over (100% - 16px), offset by half-thumb (8px)
  const thumbLeft = `calc(${reduction / 100} * (100% - 16px) + 8px)`;

  const monthlyBill = impactMetrics.estimatedMonthlyBill.value;
  const hasData = monthlyBill !== null;
  // Actual kWh recorded within the current calendar month;
  // null when the loaded dataset has no days in this month.
  const currentMonthKwh = impactMetrics.currentMonthKwh;

  const baseMonthlyKwh = hasData ? monthlyBill / ELECTRICITY_INCL_GST : null;
  const reducedKwh = baseMonthlyKwh !== null ? baseMonthlyKwh * (1 - reduction / 100) : null;
  const reducedCost = reducedKwh !== null ? reducedKwh * ELECTRICITY_INCL_GST : null;
  const savedCost = reducedCost !== null && monthlyBill !== null ? monthlyBill - reducedCost : null;
  const savedKwh = baseMonthlyKwh !== null && reducedKwh !== null ? baseMonthlyKwh - reducedKwh : null;
  const savedCo2 = savedKwh !== null ? savedKwh * CO2_KG_PER_KWH : null;

  // Progress = current-month actual (or avg monthly fallback) / target × 100
  const progressKwh = currentMonthKwh ?? baseMonthlyKwh;
  const goalProgressPct: number | null =
    progressKwh !== null && reducedKwh !== null && reducedKwh > 0
      ? Math.round((progressKwh / reducedKwh) * 100)
      : null;
  const exceeds   = goalProgressPct !== null && goalProgressPct > 100;
  const almostAt  = goalProgressPct !== null && goalProgressPct >= 90 && goalProgressPct <= 100;
  // For the visual bar clamp display to 0–100 %; label shows the real %
  const barWidth  = goalProgressPct !== null ? Math.min(goalProgressPct, 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="space-y-1.5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">Explore</p>
        <h1 className="font-(family-name:--font-display) text-3xl font-semibold tracking-tight text-white">
          Explore Your Energy Budget
        </h1>
        <p className="text-[14px] text-slate-400 leading-relaxed">
          See how small changes in usage could lower your monthly bill and reduce your impact.
        </p>
      </div>

      {/* Baseline summary row — full width */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <StatBlock
            label="Avg monthly usage"
            value={baseMonthlyKwh !== null ? fmtKwh(baseMonthlyKwh) : "—"}
          />
          <StatBlock
            label="Est. monthly cost"
            value={monthlyBill !== null ? fmtDollar(monthlyBill) : "—"}
          />
          <div className="flex flex-col gap-1">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Electricity cost</p>
            <p className="text-[15px] font-medium text-white">29.11¢ / kWh incl. GST</p>
          </div>
          {!hasData && (
            <p className="text-[12px] text-slate-500 border-l border-white/8 pl-6">
              Upload data to see your personalised estimate.
            </p>
          )}
        </div>
      </Card>

      {/* Two-column main body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">

        {/* ── LEFT: slider + goal progress ── */}
        <div className="space-y-5">

          {/* Slider card */}
          <Card className="p-5 space-y-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Reduction goal</p>
            <p className="text-[14px] text-slate-300 font-medium">
              If you reduce your usage by&hellip;
            </p>
            {/* Slider + floating label */}
            <div className="relative pt-7 pb-1">
              <div
                className="pointer-events-none absolute top-0 -translate-x-1/2"
                style={{ left: thumbLeft }}
              >
                <span className="text-[15px] font-semibold text-cyan-300">{reduction}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={reduction}
                onChange={(e) => setReduction(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer
                  bg-white/10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.6)]
                  [&::-moz-range-thumb]:w-4
                  [&::-moz-range-thumb]:h-4
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-cyan-400
                  [&::-moz-range-thumb]:border-0"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </Card>

          {/* Goal progress card */}
          <Card className="p-5 space-y-4 border-cyan-500/10">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Goal progress</p>

              {/* This month / Target / Gap */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/3 border border-white/6 px-2 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-1">This month</p>
                  <p className="text-[16px] font-semibold text-white">
                    {currentMonthKwh !== null
                      ? fmtKwh(currentMonthKwh)
                      : baseMonthlyKwh !== null ? fmtKwh(baseMonthlyKwh) : "—"}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {currentMonthKwh !== null ? "so far" : "avg monthly"}
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-500/8 border border-cyan-500/15 px-2 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-cyan-400/70 mb-1">Goal</p>
                  <p className="text-[16px] font-semibold text-cyan-300">
                    {reducedKwh !== null ? fmtKwh(reducedKwh) : "—"}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">per month</p>
                </div>
                <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 px-2 py-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-amber-400/70 mb-1">Remaining</p>
                  <p className="text-[16px] font-semibold text-amber-300">
                    {progressKwh !== null && reducedKwh !== null
                      ? fmtKwh(Math.abs(progressKwh - reducedKwh))
                      : "—"}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-0.5">to reduce</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Current vs target</span>
                  <span className={cn(
                    "font-semibold",
                    exceeds || goalProgressPct === null ? "text-red-400" : almostAt ? "text-amber-300" : "text-emerald-400",
                  )}>
                    {exceeds ? "Exceeded" : goalProgressPct !== null ? `${goalProgressPct}%` : "Error"}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      exceeds ? "bg-red-500" : almostAt ? "bg-amber-400" : "bg-emerald-400",
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* State message */}
              {almostAt && (
                <p className="text-[13px] text-amber-300 leading-relaxed">
                  You&apos;re very close — one small change could get you there.
                </p>
              )}

              {/* Tips */}
              {(exceeds || almostAt) && (
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    {exceeds ? "How to close the gap" : "One more step"}
                  </p>
                  {GAP_TIPS.slice(0, 2).map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/6 bg-white/3 px-3 py-2.5">
                      <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 flex items-center justify-center">
                        <span className="block h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      </span>
                      <p className="text-[12px] text-slate-300 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
          </Card>
        </div>

        {/* ── RIGHT: savings + impact ── */}
        <div className="space-y-5">

          {/* Savings card */}
          <Card className="p-5 space-y-4 border-emerald-500/15">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              With a {reduction}% reduction
            </p>

            {/* Bill before → after */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Current bill</p>
                <p className="text-2xl font-semibold text-white">
                  {monthlyBill !== null ? fmtDollar(monthlyBill) : "—"}
                </p>
              </div>
              <p className="text-slate-600 text-base select-none">→</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">New bill</p>
                <p className="text-2xl font-semibold text-white">
                  {reducedCost !== null ? fmtDollar(reducedCost) : "—"}
                </p>
              </div>
            </div>

            {/* Savings callout */}
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-400/70">You save</p>
                <p className={cn("text-2xl font-bold leading-tight", hasData ? "text-emerald-400" : "text-slate-500")}>
                  {savedCost !== null ? `${fmtDollar(savedCost)}/mo` : "—"}
                </p>
              </div>
              {savedKwh !== null && (
                <p className="text-[12px] text-slate-400 text-right leading-relaxed">
                  {fmtKwh(savedKwh)} less<br />each month
                </p>
              )}
            </div>
          </Card>

          {/* Impact cards — 2×2 */}
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">Impact</p>
            <div className="grid grid-cols-2 gap-3">
              <ImpactCard
                icon="💰"
                title="Monthly savings"
                body={
                  savedCost !== null
                    ? `About ${fmtDollar(savedCost)} saved every month.`
                    : "Upload data to see estimated savings."
                }
              />
              <ImpactCard
                icon="📅"
                title="Yearly savings"
                body={
                  savedCost !== null
                    ? `About ${fmtDollar(savedCost * 12)} over a full year.`
                    : "Yearly estimate available once data is loaded."
                }
              />
              <ImpactCard
                icon="🌿"
                title="Carbon"
                body={
                  savedCo2 !== null
                    ? `~${savedCo2.toFixed(1)} kg CO₂ less per month.`
                    : "Carbon estimate available once data is loaded."
                }
              />
              <ImpactCard
                icon="⚡"
                title="Peak pressure"
                body="Less usage during evening peak hours eases pressure on the grid."
              />
            </div>
          </div>

          {/* How these estimates work — accordion */}
          <div className="rounded-2xl border border-white/7 overflow-hidden">
            <button
              onClick={() => setHowOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left text-[13px] text-slate-300 hover:text-white transition-colors"
            >
              <span className="font-medium">How these estimates work</span>
              <span
                className={cn(
                  "text-slate-500 transition-transform duration-200 text-[10px]",
                  howOpen ? "rotate-180" : "",
                )}
              >
                ▾
              </span>
            </button>
            {howOpen && (
              <div className="px-5 pb-5 space-y-3 text-[13px] text-slate-400 leading-relaxed border-t border-white/5">
                <p className="pt-4">
                  <span className="text-slate-300 font-medium">Savings</span> — Calculated by applying your chosen reduction percentage to your current estimated monthly bill.
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Monthly bill</span> — Based on SP Group&apos;s regulated household rate:{" "}
                  <span className="text-white">29.11¢/kWh incl. 9% GST</span> [Q1 2026 (Jan–Mar)]. Retail plans may differ.
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Carbon</span> — Uses Singapore&apos;s grid emission factor of ~0.408 kg CO₂/kWh (EMA published data).
                </p>
                <p>
                  <span className="text-slate-300 font-medium">Peak pressure</span> — Reflects load reduction during evening peak hours (6–10 pm). This is a qualitative estimate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
