import * as React from "react";

import { cn } from "@/utils/cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state?: "default" | "error";
};

export default function Input({ className, state = "default", ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-control border bg-trackify-bg px-3 text-sm text-trackify-text placeholder:text-trackify-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-muted focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg",
        state === "default" && "border-trackify-border",
        state === "error" && "border-white/40",
        className
      )}
      {...props}
    />
  );
}

