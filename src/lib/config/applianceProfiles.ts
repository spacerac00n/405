import type { ApplianceName } from "@/types/insights";

export const applianceProfiles: Record<
  ApplianceName,
  {
    label: string;
    shortLabel: string;
    icon: string;
    accent: string;
    glow: string;
    description: string;
  }
> = {
  cooling: {
    label: "Air Con",
    shortLabel: "Air Con",
    icon: "/icons/aircon.svg",
    accent: "#53d4ff",
    glow: "rgba(83, 212, 255, 0.42)",
    description: "Likely air con usage based on late-hour patterns and reported cooling habits.",
  },
  heater: {
    label: "Shower Heater",
    shortLabel: "Heater",
    icon: "/icons/heater.svg",
    accent: "#ffb85f",
    glow: "rgba(255, 184, 95, 0.4)",
    description: "Likely water-heating activity around reported shower windows.",
  },
  laundry: {
    label: "Laundry",
    shortLabel: "Laundry",
    icon: "/icons/laundry.svg",
    accent: "#8f9bff",
    glow: "rgba(143, 155, 255, 0.4)",
    description: "Likely washer or dryer use inferred from timing and frequency signals.",
  },
  cooking: {
    label: "Cooking",
    shortLabel: "Cooking",
    icon: "/icons/cooking.svg",
    accent: "#ff7d8c",
    glow: "rgba(255, 125, 140, 0.38)",
    description: "Likely meal-prep load around breakfast, lunch, or dinner windows.",
  },
  base_load: {
    label: "Base Load",
    shortLabel: "Base",
    icon: "/icons/baseload.svg",
    accent: "#8be78f",
    glow: "rgba(139, 231, 143, 0.34)",
    description: "Always-on background demand from lighting, routers, fridges, and standby devices.",
  },
};
