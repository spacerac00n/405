import type { OnboardingProfile } from "@/types/onboarding";

import { cn } from "@/lib/utils";

type StepLaundryProps = {
  profile: OnboardingProfile;
  onChange: (patch: Partial<OnboardingProfile>) => void;
};

function ChoiceCards<T extends string>(props: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-200">{props.label}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => props.onSelect(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left text-sm transition",
              props.value === option.value
                ? "border-indigo-300/70 bg-indigo-300/10 text-white shadow-[0_0_20px_rgba(143,155,255,0.16)]"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepLaundry({ profile, onChange }: StepLaundryProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Laundry pattern
        </h3>
        <p className="text-sm leading-6 text-slate-300">
          Laundry is treated as a likely contributor when timing, weekday pattern, and
          spike size all line up.
        </p>
      </div>
      <ChoiceCards
        label="How often does laundry run each week?"
        value={profile.laundryFrequency}
        onSelect={(laundryFrequency) => onChange({ laundryFrequency })}
        options={[
          { value: "1-2", label: "1-2 times" },
          { value: "3-4", label: "3-4 times" },
          { value: "daily", label: "Daily" },
        ]}
      />
      <ChoiceCards
        label="When does laundry usually happen?"
        value={profile.laundryWindow}
        onSelect={(laundryWindow) => onChange({ laundryWindow })}
        options={[
          { value: "weekday_evening", label: "Weekday evenings" },
          { value: "weekend", label: "Weekends" },
          { value: "morning", label: "Morning" },
          { value: "varies", label: "Varies" },
        ]}
      />
    </div>
  );
}
