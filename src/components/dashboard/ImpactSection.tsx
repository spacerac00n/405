import type { ImpactMetrics } from "@/types/insights";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card } from "@/components/shared/Card";
import { SectionTitle } from "@/components/shared/SectionTitle";

type ImpactSectionProps = {
  metrics: ImpactMetrics;
};

export function ImpactSection({ metrics }: ImpactSectionProps) {
  const series = metrics.comparisonSeries;
  const maxValue = Math.max(
    ...series.flatMap((item) => [item.current ?? 0, item.comparison ?? 0]),
    1,
  );

  return (
    <Card className="space-y-6">
      <SectionTitle
        eyebrow="Impact"
        title="Comparison and outcome view"
        subtitle="Metric cards summarise current impact. The grouped chart is ready for a comparison scenario once placeholder values are plugged in."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard metric={metrics.estimatedMonthlyBill} />
        <MetricCard metric={metrics.estimatedCo2} />
        <MetricCard metric={metrics.peakTimeShare} />
      </div>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
            Grouped comparison chart
          </p>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Current vs comparison
          </p>
        </div>
        {series.length ? (
          <div className="space-y-4">
            {series.map((item) => (
              <div key={item.label} className="grid gap-3 md:grid-cols-[180px_1fr] md:items-center">
                <p className="text-sm text-slate-300">{item.label}</p>
                <div className="grid gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Current</span>
                      <span>
                        {item.current ?? "—"}
                        {item.unit}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(83,212,255,0.9),rgba(139,231,143,0.82))]"
                        style={{
                          width: `${((item.current ?? 0) / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Comparison</span>
                      <span>
                        {item.comparison ?? "—"}
                        {item.unit}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,184,95,0.92),rgba(255,125,140,0.82))]"
                        style={{
                          width: `${((item.comparison ?? 0) / maxValue) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-14 text-center text-sm leading-7 text-slate-400">
            No comparison series is configured yet. Add placeholder values in the comparison
            scenario module to populate this chart.
          </div>
        )}
      </div>
    </Card>
  );
}
