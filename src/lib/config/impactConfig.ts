export type ImpactConfig = {
  currencyLabel: string;
  billingRatePerKwh?: number;
  co2KgPerKwh?: number;
  peakWindows: Array<{
    startHour: number;
    endHour: number;
  }>;
  comparisonLabel: string;
};

export const impactConfig: ImpactConfig = {
  currencyLabel: "S$",
  // SP Group regulated household tariff (Q1 2025)
  billingRatePerKwh: 0.2911, // incl. 9% GST
  co2KgPerKwh: 0.4085,       // Singapore grid emission factor (EMA 2023)
  peakWindows: [{ startHour: 18, endHour: 22 }],
  comparisonLabel: "Comparison scenario",
};
