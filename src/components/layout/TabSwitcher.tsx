import { cn } from "@/lib/utils";

export type TourTab = "understand" | "explore" | "improve";

const tabs: Array<{ key: TourTab; label: string }> = [
  { key: "understand", label: "Understand" },
  { key: "explore", label: "Explore" },
  { key: "improve", label: "Achievement" },
];

type TabSwitcherProps = {
  activeTab: TourTab;
  onChange: (tab: TourTab) => void;
};

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
  return (
    <div className="inline-flex rounded-full border border-white/8 bg-white/[0.04] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "rounded-full px-4 py-2 text-sm transition",
            activeTab === tab.key
              ? "bg-white text-slate-950 shadow-[0_10px_24px_rgba(255,255,255,0.12)]"
              : "text-slate-400 hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
