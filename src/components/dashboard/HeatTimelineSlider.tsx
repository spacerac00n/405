"use client";

import { useState } from "react";

import type { EnergySlot, SpikeDetection } from "@/types/energy";

import { formatSlotLabel } from "@/lib/energy/formatters";
import { cn } from "@/lib/utils";

type HeatTimelineSliderProps = {
  slots: EnergySlot[];
  selectedSlotTimestamp: string | null;
  spikes: SpikeDetection[];
  onSelect: (timestamp: string) => void;
};

function getThermalColor(intensity: number) {
  const hue = 220 - intensity * 210;
  const saturation = 80 + intensity * 10;
  const lightness = 18 + intensity * 42;

  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

export function HeatTimelineSlider({
  slots,
  selectedSlotTimestamp,
  spikes,
  onSelect,
}: HeatTimelineSliderProps) {
  const [hoveredTimestamp, setHoveredTimestamp] = useState<string | null>(null);
  const maxValue = Math.max(...slots.map((slot) => slot.kwh), 0.01);
  const minValue = Math.min(...slots.map((slot) => slot.kwh), 0);
  const spikeMap = new Map(spikes.map((spike) => [spike.timestamp, spike]));

  const hoveredSlot =
    slots.find((slot) => slot.timestamp === hoveredTimestamp) ?? null;
  const selectedSlot =
    slots.find((slot) => slot.timestamp === selectedSlotTimestamp) ?? null;
  const activeSlot = hoveredSlot ?? selectedSlot;
  const activeIndex = activeSlot
    ? slots.findIndex((slot) => slot.timestamp === activeSlot.timestamp)
    : -1;

  if (!slots.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/8 bg-white/[0.02] px-6 py-12 text-center text-sm text-slate-500">
        No full day is available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[30px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Thermal day scan
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {activeSlot
                ? `${formatSlotLabel(activeSlot.timestamp)} \u2022 ${activeSlot.kwh.toFixed(2)} kWh`
                : "Pick a half-hour segment"}
            </p>
          </div>
          {/* Info icon with tooltip */}
          <div className="group relative ml-1 flex-shrink-0">
            <button
              type="button"
              aria-label="About half-hourly usage"
              className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-[10px] text-slate-400 transition hover:border-white/40 hover:text-slate-200"
            >
              i
            </button>
            <div className="pointer-events-none absolute left-1/2 top-7 z-30 w-[230px] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-900/98 px-4 py-3.5 opacity-0 shadow-xl transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">How to read this</p>
              <ul className="space-y-1.5 text-[11px] leading-snug text-slate-300">
                <li className="flex gap-2"><span className="mt-px text-slate-500">·</span>Each bar = one 30-minute period</li>
                <li className="flex gap-2"><span className="mt-px text-slate-500">·</span>Brighter colour = higher usage</li>
                <li className="flex gap-2"><span className="mt-px text-slate-500">·</span><span><span className="font-bold text-white">!</span> = unusual spike detected</span></li>
                <li className="flex gap-2"><span className="mt-px text-slate-500">·</span>Tap a bar to see appliance breakdown</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Hotter segments indicate stronger household usage.
        </p>
      </div>
      <div className="relative">
        {activeSlot && activeIndex >= 0 ? (
          <div
            className="absolute -top-11 z-10 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/95 px-3 py-1.5 text-xs text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            style={{
              left: `calc(${((activeIndex + 0.5) / slots.length) * 100}% )`,
            }}
          >
            {formatSlotLabel(activeSlot.timestamp)} • {activeSlot.kwh.toFixed(2)} kWh
          </div>
        ) : null}
        <div
          className="grid gap-[3px] rounded-full bg-white/[0.03] p-2"
          style={{ gridTemplateColumns: "repeat(48, minmax(0, 1fr))" }}
        >
          {slots.map((slot) => {
            const normalized =
              maxValue === minValue ? 0.4 : (slot.kwh - minValue) / (maxValue - minValue);
            const selected = slot.timestamp === selectedSlotTimestamp;
            const spike = spikeMap.get(slot.timestamp);

            return (
              <button
                key={slot.timestamp}
                type="button"
                onClick={() => onSelect(slot.timestamp)}
                onMouseEnter={() => setHoveredTimestamp(slot.timestamp)}
                onMouseLeave={() => setHoveredTimestamp(null)}
                onFocus={() => setHoveredTimestamp(slot.timestamp)}
                onBlur={() => setHoveredTimestamp(null)}
                className={cn(
                  "relative h-12 rounded-full transition focus:outline-none",
                  selected && "ring-2 ring-amber-300/95 ring-offset-2 ring-offset-slate-950",
                )}
                style={{
                  backgroundColor: getThermalColor(normalized),
                  boxShadow: selected
                    ? "0 0 22px rgba(255,184,95,0.4)"
                    : `0 0 ${8 + normalized * 14}px rgba(255,120,80,${0.12 + normalized * 0.18})`,
                }}
                aria-label={`${formatSlotLabel(slot.timestamp)}, ${slot.kwh.toFixed(2)} kWh`}
              >
                <span
                  className="absolute inset-[5px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.03))",
                    opacity: 0.4 + normalized * 0.3,
                  }}
                />
                {spike?.isSpike ? (
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold leading-none text-white/90">!</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] text-slate-600">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11:30pm</span>
      </div>
    </div>
  );
}
