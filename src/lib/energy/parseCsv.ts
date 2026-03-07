import type { RawEnergyInput } from "@/types/energy";

const requiredHeaders = ["timestamp", "kwh"] as const;

function stripBom(value: string) {
  return value.replace(/^\uFEFF/, "");
}

export async function parseCsvFile(file: File) {
  const content = await file.text();
  return parseCsvText(content);
}

export function parseCsvText(content: string) {
  const lines = stripBom(content)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV is empty. Add a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());

  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw new Error(`CSV must include "${header}" columns.`);
    }
  }

  const timestampIndex = headers.indexOf("timestamp");
  const kwhIndex = headers.indexOf("kwh");

  const records: RawEnergyInput[] = lines.slice(1).map((line, index) => {
    const cells = line.split(",").map((cell) => cell.trim());

    if (cells.length < 2) {
      throw new Error(`Row ${index + 2} is incomplete.`);
    }

    const timestamp = cells[timestampIndex];
    const kwhValue = Number(cells[kwhIndex]);

    if (!timestamp) {
      throw new Error(`Row ${index + 2} is missing a timestamp.`);
    }

    if (!Number.isFinite(kwhValue)) {
      throw new Error(`Row ${index + 2} has an invalid kWh value.`);
    }

    return {
      timestamp,
      kwh: kwhValue,
    };
  });

  return records;
}
