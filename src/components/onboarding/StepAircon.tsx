import type { OnboardingProfile } from "@/types/onboarding";

import { cn } from "@/lib/utils";

type StepAirconProps = {
  profile: OnboardingProfile;
  onChange: (patch: Partial<OnboardingProfile>) => void;
};

function ChoiceChips<T extends string>(props: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-200">{props.label}</p>
      <div className="flex flex-wrap gap-2">
        {props.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => props.onSelect(option.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              props.value === option.value
                ? "border-cyan-300/70 bg-cyan-300/12 text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepAircon({ profile, onChange }: StepAirconProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Cooling habits
        </h3>
        <p className="text-sm leading-6 text-slate-300">
          Cooling tends to be the strongest likely contributor in late evening and
          overnight slots, so this step matters a lot.
        </p>
      </div>
      <ChoiceChips
        label="How often is aircon used?"
        value={profile.airconFrequency}
        onSelect={(airconFrequency) => onChange({ airconFrequency })}
        options={[
          { value: "rarely", label: "Rarely" },
          { value: "few_nights", label: "A few nights" },
          { value: "almost_nightly", label: "Almost nightly" },
          { value: "day_and_night", label: "Day and night" },
        ]}
      />
      <ChoiceChips
        label="When is aircon usually on?"
        value={profile.airconWindow}
        onSelect={(airconWindow) => onChange({ airconWindow })}
        options={[
          { value: "afternoon", label: "Afternoon" },
          { value: "evening", label: "Evening" },
          { value: "overnight", label: "Overnight" },
          { value: "varies", label: "Varies" },
        ]}
      />
      <ChoiceChips
        label="How long does it usually run?"
        value={profile.airconDuration}
        onSelect={(airconDuration) => onChange({ airconDuration })}
        options={[
          { value: "<2h", label: "<2h" },
          { value: "2-4h", label: "2-4h" },
          { value: "4-8h", label: "4-8h" },
          { value: "overnight", label: "Overnight" },
        ]}
      />
    </div>
  );
}
