import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
