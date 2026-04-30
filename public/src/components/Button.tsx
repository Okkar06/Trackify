import * as React from "react";

import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export default function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-control border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border-trackify-border bg-trackify-text text-trackify-bg hover:bg-white/90 active:bg-white/80",
        variant === "secondary" &&
          "border-trackify-border bg-trackify-surface text-trackify-text hover:bg-trackify-surface2 active:bg-trackify-surface2",
        className
      )}
      {...props}
    />
  );
}
