"use client";

import { useEffect, useState } from "react";

import { StepAircon } from "@/components/onboarding/StepAircon";
import { StepHeater } from "@/components/onboarding/StepHeater";
import { StepHousehold } from "@/components/onboarding/StepHousehold";
import { StepLaundry } from "@/components/onboarding/StepLaundry";
import { Badge } from "@/components/shared/Badge";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import type { OnboardingProfile, OnboardingStep } from "@/types/onboarding";

const orderedSteps: OnboardingStep[] = ["household", "aircon", "heater", "laundry"];

type OnboardingModalProps = {
  open: boolean;
  initialProfile: OnboardingProfile;
  onComplete: (profile: OnboardingProfile) => void;
  onDismiss?: () => void;
};

const stepMeta: Record<
  OnboardingStep,
  {
    badge: string;
    title: string;
    caption: string;
  }
> = {
  household: {
    badge: "Step 1",
    title: "Set the household context",
    caption: "We use this to guide the inference engine for likely contributors.",
  },
  aircon: {
    badge: "Step 2",
    title: "Map the cooling pattern",
    caption: "Late-night cooling is one of the strongest contributors to spikes.",
  },
  heater: {
    badge: "Step 3",
    title: "Capture shower timing",
    caption: "Short peaks can align with morning or evening heater sessions.",
  },
  laundry: {
    badge: "Step 4",
    title: "Finish with laundry habits",
    caption: "This helps separate recurring routines from one-off surges.",
  },
};

export function OnboardingModal({
  open,
  initialProfile,
  onComplete,
  onDismiss,
}: OnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [draftProfile, setDraftProfile] = useState(initialProfile);

  useEffect(() => {
    if (open) {
      setDraftProfile(initialProfile);
      setStepIndex(0);
    }
  }, [initialProfile, open]);

  if (!open) {
    return null;
  }

  const currentStep = orderedSteps[stepIndex];
  const meta = stepMeta[currentStep];
  const progress = ((stepIndex + 1) / orderedSteps.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 px-4 py-8 backdrop-blur-md"
      onClick={onDismiss}
    >
      <Card className="relative w-full max-w-4xl overflow-hidden border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(83,212,255,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(6,10,21,0.98))] p-0" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col justify-between border-b border-white/10 p-8 lg:border-r lg:border-b-0">
            <div className="space-y-5">
              <Badge>{meta.badge}</Badge>
              <div className="space-y-3">
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white">
                  {meta.title}
                </h2>
                <p className="max-w-md text-sm leading-7 text-slate-300">{meta.caption}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                  <span>Progress</span>
                  <span>
                    {stepIndex + 1}/{orderedSteps.length}
                  </span>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(83,212,255,0.9),rgba(139,231,143,0.92))]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 text-xs leading-6 text-slate-400">
              Appliance labels are always shown as likely contributors because the app only
              sees household-level total usage.
            </div>
          </div>
          <div className="p-8">
            {currentStep === "household" ? (
              <StepHousehold
                profile={draftProfile}
                onChange={(patch) => setDraftProfile({ ...draftProfile, ...patch })}
              />
            ) : null}
            {currentStep === "aircon" ? (
              <StepAircon
                profile={draftProfile}
                onChange={(patch) => setDraftProfile({ ...draftProfile, ...patch })}
              />
            ) : null}
            {currentStep === "heater" ? (
              <StepHeater
                profile={draftProfile}
                onChange={(patch) => setDraftProfile({ ...draftProfile, ...patch })}
              />
            ) : null}
            {currentStep === "laundry" ? (
              <StepLaundry
                profile={draftProfile}
                onChange={(patch) => setDraftProfile({ ...draftProfile, ...patch })}
              />
            ) : null}
            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
              <Button
                variant="ghost"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {stepIndex === orderedSteps.length - 1 ? (
                <Button onClick={() => onComplete(draftProfile)}>Launch dashboard</Button>
              ) : (
                <Button onClick={() => setStepIndex((current) => current + 1)}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
