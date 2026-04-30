import * as React from "react";

import Button from "@/components/Button";
import { cn } from "@/utils/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarMonthProps = {
  month: number;
  year: number;
  selectedDate?: string;
  indicators?: Set<string>;
  onSelectDate?: (date: string) => void;
  onMonthChange?: (next: { month: number; year: number }) => void;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getLocalISODate = () => {
  const now = new Date();
  const local = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return local.toISOString().slice(0, 10);
};

const getMonthLabel = (month: number, year: number) => {
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
};

const buildMonthGrid = ({ month, year }: { month: number; year: number }) => {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const dayOfWeek = firstOfMonth.getUTCDay();
  const startDate = new Date(Date.UTC(year, month - 1, 1 - dayOfWeek));

  return Array.from({ length: 42 }).map((_, idx) => {
    const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + idx));
    const iso = date.toISOString().slice(0, 10);
    return {
      iso,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
    };
  });
};

const getPrevMonth = ({ month, year }: { month: number; year: number }) => {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
};

const getNextMonth = ({ month, year }: { month: number; year: number }) => {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
};

export default function CalendarMonth({
  month,
  year,
  selectedDate,
  indicators,
  onSelectDate,
  onMonthChange,
}: CalendarMonthProps) {
  const todayIso = React.useMemo(() => getLocalISODate(), []);
  const grid = React.useMemo(() => buildMonthGrid({ month, year }), [month, year]);
  const label = React.useMemo(() => getMonthLabel(month, year), [month, year]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-trackify-text">Calendar</div>
          <div className="mt-1 text-sm text-trackify-muted">{label}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-9 w-9 p-0"
            onClick={() => onMonthChange?.(getPrevMonth({ month, year }))}
            disabled={!onMonthChange}
            aria-label="Previous month"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="h-9 w-9 p-0"
            onClick={() => onMonthChange?.(getNextMonth({ month, year }))}
            disabled={!onMonthChange}
            aria-label="Next month"
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekdayLabels.map((day) => (
          <div key={day} className="px-1 text-xs font-medium text-trackify-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {grid.map((cell) => {
          const isSelected = selectedDate === cell.iso;
          const isToday = todayIso === cell.iso;
          const hasIndicator = indicators?.has(cell.iso) ?? false;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelectDate?.(cell.iso)}
              className={cn(
                "relative flex h-20 flex-col rounded-control border border-trackify-border bg-trackify-surface px-3 py-2 text-left transition-colors",
                "hover:bg-trackify-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg",
                !cell.inMonth && "opacity-40",
                isSelected && "border-trackify-border2 bg-trackify-surface2",
                isToday && "ring-1 ring-trackify-text/25"
              )}
              aria-current={isToday ? "date" : undefined}
              aria-selected={isSelected}
            >
              <div className="text-xs font-medium text-trackify-text">{cell.day}</div>
              <div className="mt-auto flex items-center gap-2">
                {hasIndicator ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-trackify-text" />
                ) : (
                  <div className="h-1.5 w-1.5" />
                )}
                <div className="text-xs text-trackify-muted">&nbsp;</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
