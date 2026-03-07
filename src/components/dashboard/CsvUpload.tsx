"use client";

import type { ChangeEvent } from "react";

import { Badge } from "@/components/shared/Badge";
import { cn } from "@/lib/utils";

type CsvUploadProps = {
  datasetOrigin: "placeholder" | "csv";
  datasetLabel: string;
  error: string | null;
  onFileSelect: (file: File) => Promise<void>;
};

export function CsvUpload({
  datasetOrigin,
  datasetLabel,
  error,
  onFileSelect,
}: CsvUploadProps) {
  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await onFileSelect(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-end gap-2">
        <Badge className="border-white/8 bg-white/[0.04] text-slate-400">
          {datasetOrigin === "csv" ? "CSV active" : "Built-in data"}
        </Badge>
        <label className="inline-flex cursor-pointer">
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={handleChange}
          />
          <span
            className={cn(
              "inline-flex h-10 items-center rounded-full border border-white/10 bg-white/[0.05] px-4 text-sm text-slate-200 transition hover:bg-white/[0.1]",
              error && "border-rose-400/25 text-rose-100",
            )}
          >
            Upload CSV
          </span>
        </label>
      </div>
      <p className="text-right text-[11px] text-slate-500">{datasetLabel}</p>
      {error ? (
        <p className="max-w-[280px] text-right text-[11px] leading-5 text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
