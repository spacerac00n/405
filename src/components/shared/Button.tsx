import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md";
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        size === "md" && "h-11 px-5 text-sm",
        size === "sm" && "h-9 px-4 text-xs uppercase tracking-[0.24em]",
        size === "xs" && "h-8 px-3 text-xs",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,rgba(87,214,255,0.92),rgba(135,255,181,0.88))] text-slate-950 shadow-[0_10px_30px_rgba(83,212,255,0.22)] hover:brightness-105",
        variant === "secondary" &&
          "border border-white/12 bg-white/[0.05] text-white hover:bg-white/[0.1]",
        variant === "ghost" &&
          "text-slate-300 hover:bg-white/[0.06] hover:text-white",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
