import * as React from "react";

import Button from "@/components/Button";
import { cn } from "@/utils/cn";
import { useServerWakeStore } from "@/stores/serverWakeStore";

const Dots = () => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setCount((c) => (c + 1) % 4), 450);
    return () => window.clearInterval(id);
  }, []);
  return <span aria-hidden="true">{Array.from({ length: count }).map(() => ".").join("")}</span>;
};

export default function ServerWakeOverlay() {
  const phase = useServerWakeStore((s) => s.phase);
  const lastError = useServerWakeStore((s) => s.lastError);
  const close = useServerWakeStore((s) => s.close);

  const isOpen = phase !== "hidden";
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-card border border-trackify-border bg-trackify-surface shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        )}
      >
        <div className="px-6 py-6">
          <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-trackify-border bg-trackify-surface2",
                phase === "loading" ? "" : "border-white/20"
              )}
            >
              {phase === "loading" ? (
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-trackify-muted2 border-t-trackify-text" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-sm text-trackify-text">
                  !
                </div>
              )}
            </div>

            {phase === "loading" ? (
              <>
                <div className="text-lg font-semibold tracking-tight text-trackify-text">
                  Waking up server<Dots />
                </div>
                <div className="mt-2 text-sm text-trackify-muted">
                  This may take up to 30–50 seconds on first load.
                </div>
                <div className="mt-4 text-sm text-trackify-muted">Thanks for your patience 🙏</div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold tracking-tight text-trackify-text">Server is taking longer than expected</div>
                <div className="mt-2 text-sm text-trackify-muted">{lastError}</div>
                <div className="mt-5 flex w-full flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      window.location.reload();
                    }}
                  >
                    Retry
                  </Button>
                  <Button type="button" variant="secondary" className="w-full" onClick={close}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

