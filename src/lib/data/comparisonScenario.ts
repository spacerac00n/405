export type ComparisonMetricKey = "bill" | "co2" | "peak_share";

export type ComparisonMetric = {
  key: ComparisonMetricKey;
  label: string;
  before: number;
  after: number;
  unit: string;
  format: "currency" | "number" | "percent";
  description: string;
};

export const impactMetrics: ComparisonMetric[] = [
  {
    key: "bill",
    label: "Estimated monthly bill",
    before: 168,
    after: 144,
    unit: "S$",
    format: "currency",
    description:
      "Lower bills are a side effect of flatter demand. When fewer households spike at the same time, grid operators need less reserve capacity.",
  },
  {
    key: "co2",
    label: "Estimated CO2",
    before: 118,
    after: 101,
    unit: "kg CO2 / month",
    format: "number",
    description:
      "The grid burns cleaner when demand is spread more evenly. Reducing peak load is one of the fastest levers for cutting grid emissions.",
  },
  {
    key: "peak_share",
    label: "Peak-time usage share",
    before: 34,
    after: 25,
    unit: "%",
    format: "percent",
    description:
      "Every percentage point of demand shifted out of the evening peak reduces stress on transmission lines and lowers the risk of supply shortfalls.",
  },
];

export const comparisonScenario = {
  title: "How personal changes support grid reliability",
  subtitle:
    "Small, consistent routine shifts — like moving laundry off-peak or shortening heater runtime — add up across thousands of households. These figures model what that looks like for a typical Singapore working-adults home.",
  metrics: impactMetrics,
  metricBenchmarks: {
    bill: impactMetrics[0].after,
    carbon: impactMetrics[1].after,
    peak: impactMetrics[2].after / 100,
  },
  series: impactMetrics.map((metric) => ({
    label: metric.label,
    current: metric.before,
    comparison: metric.after,
    unit: metric.unit,
  })),
};
