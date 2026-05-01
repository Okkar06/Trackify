import * as React from "react";
import { Calendar } from "lucide-react";

import CalendarMonth from "@/components/CalendarMonth";
import Button from "@/components/Button";
import { cn } from "@/utils/cn";

type DatePickerModalProps = {
  open: boolean;
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  title?: string;
};

const getTodayMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const getMonthYearFromIso = (iso: string) => {
  if (!iso) return getTodayMonthYear();
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return getTodayMonthYear();
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
};

export default function DatePickerModal({ open, value, onChange, onClose, title }: DatePickerModalProps) {
  const [isMounted, setIsMounted] = React.useState(open);
  const [{ month, year }, setMonthYear] = React.useState(() => getMonthYearFromIso(value));

  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
      setMonthYear(getMonthYearFromIso(value));
      return;
    }
    const t = window.setTimeout(() => setIsMounted(false), 160);
    return () => window.clearTimeout(t);
  }, [open, value]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (!open) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          "relative w-full max-w-lg overflow-hidden rounded-card border border-trackify-border bg-trackify-surface shadow-[0_1px_0_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.65)] transition-all duration-150",
          open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-trackify-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-control border border-trackify-border bg-trackify-surface2">
              <Calendar className="h-5 w-5 text-trackify-text" />
            </div>
            <div>
              <div className="text-sm font-medium text-trackify-text">{title || "Select date"}</div>
              <div className="mt-1 text-xs text-trackify-muted">Tap a day to apply</div>
            </div>
          </div>
          <Button variant="secondary" onClick={onClose} type="button">
            Done
          </Button>
        </div>

        <div className="p-5">
          <div className="rounded-control border border-trackify-border bg-trackify-surface2 p-4">
            <CalendarMonth
              month={month}
              year={year}
              selectedDate={value}
              onSelectDate={(iso) => {
                onChange(iso);
                onClose();
              }}
              onMonthChange={(next) => setMonthYear(next)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
