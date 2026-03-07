import { cn } from "@/lib/utils";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: SectionTitleProps) {
  return (
    <div className={cn("space-y-2", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-1">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-6 text-slate-300">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
