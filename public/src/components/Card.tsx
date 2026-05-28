import * as React from "react";

import { cn } from "@/utils/cn";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-trackify-border bg-trackify-surface shadow-[0_1px_0_rgba(255,255,255,0.04),0_16px_48px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: DivProps) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  return <div className={cn("text-xs font-medium uppercase tracking-wide text-trackify-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  return <div className={cn("px-5 pb-5", className)} {...props} />;
}
