import type { EnergyChallenge, HabitInsights } from "@/types/habits";

import { Card } from "@/components/shared/Card";

type ImproveTabProps = {
  hasData: boolean;
  challenges: EnergyChallenge[];
  habitInsights: HabitInsights;
};

export function ImproveTab({
  hasData,
  challenges,
  habitInsights,
}: ImproveTabProps) {
  if (!hasData) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">
            Achievement
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white">
            Challenges to change behavior
          </h1>
        </div>
        <Card className="px-6 py-12 text-center text-sm leading-7 text-slate-500">
          Upload complete daily data to view challenges and reward points.
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/65">Achievement</p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white">
          Challenges to change behavior
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/70">Three Challenges</p>
            <p className="text-sm text-slate-400">
              All challenges are mandatory and scored weekly from Monday to Sunday.
            </p>
          </div>

          <div className="space-y-3">
            {challenges.map((challenge) => {
              const progress = habitInsights.challengeProgress.find((item) => item.key === challenge.key);

              return (
                <div key={challenge.key} className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="block text-sm font-medium text-white">{challenge.title}</span>
                      <span className="block text-xs leading-5 text-slate-400">{challenge.description}</span>
                    </div>
                    <span className="rounded-lg border border-white/15 bg-slate-900 px-2 py-1 text-xs text-slate-200">
                      10 points
                    </span>
                  </div>

                  {progress ? (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-400">
                        <span>
                          {progress.completedDays}/{progress.durationDays} days complete
                        </span>
                        <span>{progress.metToday ? "Met today" : "Not met today"}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                          style={{ width: `${Math.round(progress.progress * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-100/70">Reward points</p>
          <p className="font-[family-name:var(--font-display)] text-5xl font-semibold text-white">
            {habitInsights.rewardPoints} pts
          </p>
          <p className="text-sm text-slate-300">Cumulative reward points from completed weekly challenges.</p>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            {habitInsights.challengePoints.map((item) => (
              <div key={item.key} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.title}</span>
                <span className="font-medium text-white">
                  {item.weeklyPoints} pts this week • {item.cumulativePoints} total
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-full border border-cyan-300/35 bg-cyan-300/12 px-3 py-2 text-sm font-medium text-cyan-100">
            Weekly points: {habitInsights.weeklyPoints} pts
          </div>
          <div className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-3 py-2 text-sm font-medium text-emerald-100">
            Cumulative total: {habitInsights.rewardPoints} pts
          </div>
        </Card>
      </div>
    </div>
  );
}
