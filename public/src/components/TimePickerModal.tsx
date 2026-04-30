import * as React from "react";
import { Clock } from "lucide-react";

import Button from "@/components/Button";
import { cn } from "@/utils/cn";

type TimePickerModalProps = {
  open: boolean;
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  title?: string;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const parse24 = (value: string) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
};

const to12h = ({ h, m }: { h: number; m: number }) => {
  const ampm: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, ampm };
};

const to24h = ({ hour12, minute, ampm }: { hour12: number; minute: number; ampm: "AM" | "PM" }) => {
  const h0 = hour12 % 12;
  const h = ampm === "PM" ? h0 + 12 : h0;
  return `${pad2(h)}:${pad2(minute)}`;
};

const buildRange = (from: number, to: number) => Array.from({ length: to - from + 1 }).map((_, i) => from + i);

const hours12 = buildRange(1, 12);
const minutes = [0, 15, 30, 45];
const ampmValues: Array<"AM" | "PM"> = ["AM", "PM"];

export default function TimePickerModal({ open, value, onChange, onClose, title }: TimePickerModalProps) {
  const [isMounted, setIsMounted] = React.useState(open);

  const parsed = React.useMemo(() => parse24(value) || { h: 9, m: 0 }, [value]);
  const initial = React.useMemo(() => to12h(parsed), [parsed]);

  const [selectedHour12, setSelectedHour12] = React.useState<number>(initial.hour12);
  const [selectedMinute, setSelectedMinute] = React.useState<number>(minutes.includes(initial.minute) ? initial.minute : 0);
  const [selectedAmpm, setSelectedAmpm] = React.useState<"AM" | "PM">(initial.ampm);

  React.useEffect(() => {
    setSelectedHour12(initial.hour12);
    setSelectedMinute(minutes.includes(initial.minute) ? initial.minute : 0);
    setSelectedAmpm(initial.ampm);
  }, [initial.hour12, initial.minute, initial.ampm]);

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      return;
    }
    const t = window.setTimeout(() => setIsMounted(false), 160);
    return () => window.clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (!open) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!isMounted) return null;

  const nextValue = to24h({
    hour12: selectedHour12,
    minute: selectedMinute,
    ampm: selectedAmpm,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-lg overflow-hidden rounded-[20px] border border-white/10 bg-[#0A0F1A]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all duration-150",
          open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-control border border-white/10 bg-white/5">
              <Clock className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <div className="text-sm font-medium text-white">{title || "Select time"}</div>
              <div className="mt-1 text-xs text-white/60">Tap to choose</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} type="button" className="h-9">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChange(nextValue);
                onClose();
              }}
              type="button"
              className="h-9 bg-white text-black hover:bg-white/90"
            >
              Apply
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="relative overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
            <div className="grid grid-cols-3">
              <div className="px-4 py-4">
                <div className="mb-2 text-xs text-white/60">Hour</div>
                <div className="grid grid-cols-3 gap-2">
                  {hours12.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHour12(h)}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-control border text-lg transition-colors",
                        h === selectedHour12
                          ? "border-sky-400/35 bg-sky-400/10 text-white"
                          : "border-white/10 bg-white/0 text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="mb-2 text-xs text-white/60">Minute</div>
                <div className="grid grid-cols-2 gap-2">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinute(m)}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-control border text-lg transition-colors tabular-nums",
                        m === selectedMinute
                          ? "border-sky-400/35 bg-sky-400/10 text-white"
                          : "border-white/10 bg-white/0 text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {pad2(m)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4 py-4">
                <div className="mb-2 text-xs text-white/60">AM/PM</div>
                <div className="grid gap-2">
                  {ampmValues.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedAmpm(v)}
                      className={cn(
                        "flex h-11 w-full items-center justify-center rounded-control border text-lg transition-colors",
                        v === selectedAmpm
                          ? "border-sky-400/35 bg-sky-400/10 text-white"
                          : "border-white/10 bg-white/0 text-white/60 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-white/70">
            Selected: <span className="font-medium text-white">{nextValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
