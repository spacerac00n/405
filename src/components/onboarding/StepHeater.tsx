import type { OnboardingProfile } from "@/types/onboarding";

import { cn } from "@/lib/utils";

type StepHeaterProps = {
  profile: OnboardingProfile;
  onChange: (patch: Partial<OnboardingProfile>) => void;
};

function ChoiceGrid<T extends string>(props: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; description: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-200">{props.label}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => props.onSelect(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition",
              props.value === option.value
                ? "border-amber-300/70 bg-amber-300/10 text-white shadow-[0_0_20px_rgba(255,184,95,0.16)]"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <p className="text-sm font-medium">{option.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepHeater({ profile, onChange }: StepHeaterProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Shower heater routine
        </h3>
        <p className="text-sm leading-6 text-slate-300">
          Heater inference looks at shorter morning or evening bursts and weighs them
          against reported shower timing.
        </p>
      </div>
      <ChoiceGrid
        label="When are showers usually taken?"
        value={profile.showerWindow}
        onSelect={(showerWindow) => onChange({ showerWindow })}
        options={[
          {
            value: "morning",
            label: "Morning",
            description: "Mostly between wake-up and commute hours.",
          },
          {
            value: "evening",
            label: "Evening",
            description: "Mostly after work or before bed.",
          },
          {
            value: "both",
            label: "Both",
            description: "Morning and evening usage is common.",
          },
        ]}
      />
      <ChoiceGrid
        label="How long are showers on average?"
        value={profile.showerLength}
        onSelect={(showerLength) => onChange({ showerLength })}
        options={[
          {
            value: "short",
            label: "Short",
            description: "Quick rinse or low heater runtime.",
          },
          {
            value: "medium",
            label: "Medium",
            description: "Typical daily showers.",
          },
          {
            value: "long",
            label: "Long",
            description: "Longer heater sessions are common.",
          },
        ]}
      />
    </div>
  );
}
