import * as React from "react";

import { cn } from "@/utils/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  state?: "default" | "error";
};

export default function Textarea({ className, state = "default", ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-control border bg-trackify-surface px-3 py-2 text-sm text-trackify-text placeholder:text-trackify-muted2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg",
        state === "default" && "border-trackify-border",
        state === "error" && "border-white/25",
        className
      )}
      {...props}
    />
  );
}
