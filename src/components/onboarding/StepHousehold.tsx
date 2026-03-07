import type { OnboardingProfile } from "@/types/onboarding";

import { cn } from "@/lib/utils";

type StepHouseholdProps = {
  profile: OnboardingProfile;
  onChange: (patch: Partial<OnboardingProfile>) => void;
};

function ChoiceRow<T extends string>(props: {
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
                ? "border-cyan-300/70 bg-cyan-300/10 text-white shadow-[0_0_20px_rgba(83,212,255,0.16)]"
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

export function StepHousehold({ profile, onChange }: StepHouseholdProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
          Household snapshot
        </h3>
        <p className="text-sm leading-6 text-slate-300">
          These habits steer the inference engine. The dashboard will only show likely
          contributors, not exact appliance truth.
        </p>
      </div>
      <ChoiceRow
        label="How many people live here?"
        value={profile.householdSize}
        onSelect={(householdSize) => onChange({ householdSize })}
        options={[
          { value: "1", label: "1 person" },
          { value: "2", label: "2 people" },
          { value: "3-4", label: "3-4 people" },
          { value: "5+", label: "5+ people" },
        ]}
      />
      <ChoiceRow
        label="What kind of home is it?"
        value={profile.homeType}
        onSelect={(homeType) => onChange({ homeType })}
        options={[
          { value: "3-room", label: "3-room" },
          { value: "4-room", label: "4-room" },
          { value: "5-room", label: "5-room" },
          { value: "condo", label: "Condo" },
        ]}
      />
      <ChoiceRow
        label="What matters most?"
        value={profile.priority}
        onSelect={(priority) => onChange({ priority })}
        options={[
          { value: "bill", label: "Lower bills" },
          { value: "carbon", label: "Lower carbon" },
          { value: "peak", label: "Reduce peak load" },
          { value: "all", label: "All of the above" },
        ]}
      />
    </div>
  );
}
