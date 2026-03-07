import type { ImpactMetricCard } from "@/types/insights";

import { Card } from "@/components/shared/Card";
import { formatCompactNumber } from "@/lib/energy/formatters";

type MetricCardProps = {
  metric: ImpactMetricCard;
};

export function MetricCard({ metric }: MetricCardProps) {
  const hasValue = metric.value !== null;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(83,212,255,0.72),transparent)]" />
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">
          {metric.label}
        </p>
        <div className="flex items-end gap-2">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white">
            {hasValue ? formatCompactNumber(metric.value, metric.key === "peak" ? 0 : 1) : "—"}
          </p>
          <p className="pb-1 text-sm text-slate-400">{metric.unit}</p>
        </div>
        <p className="text-sm leading-6 text-slate-300">{metric.description}</p>
        {metric.benchmarkValue !== null && metric.benchmarkValue !== undefined ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
            {metric.benchmarkLabel}: {formatCompactNumber(metric.benchmarkValue, 1)}
            {metric.unit}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
