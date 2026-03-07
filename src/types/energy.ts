export type RawEnergyInput = {
  timestamp: string;
  kwh: number;
};

export type EnergySlot = {
  timestamp: string;
  dayKey: string;
  label: string;
  kwh: number;
};

export type DayEnergySeries = {
  dayKey: string;
  label: string;
  slots: EnergySlot[];
  totalKwh: number;
  averageKwh: number;
  peakKwh: number;
};

export type DailyStats = {
  averageKwh: number;
  standardDeviation: number;
  totalKwh: number;
  minKwh: number;
  maxKwh: number;
};

export type SpikeDetection = {
  timestamp: string;
  dayKey: string;
  spikeScore: number;
  deltaFromAverage: number;
  zScore: number;
  threshold: number;
  isSpike: boolean;
};

export type WeeklySummaryItem = {
  dayKey: string;
  label: string;
  shortLabel: string;
  totalKwh: number;
  averageKwh: number;
  peakKwh: number;
  spikeCount: number;
  complete: boolean;
};

export type DatasetOrigin = "placeholder" | "csv";
