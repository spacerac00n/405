import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/6 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(2,6,18,0.32)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
