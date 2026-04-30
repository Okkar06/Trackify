import * as React from "react";
import { Calendar, Clock, Minus, Plus, Trash2 } from "lucide-react";

import DatePickerModal from "@/components/DatePickerModal";
import TimePickerModal from "@/components/TimePickerModal";
import Textarea from "@/components/Textarea";
import Button from "@/components/Button";
import { cn } from "@/utils/cn";

export type WorkEntryDraftValue = {
  date: string;
  start_time: string;
  end_time: string;
  break_time: string;
  pay_rate: string;
  meal_allowance: string;
  notes: string;
};

export type WorkEntryDraftErrors = Partial<Record<keyof WorkEntryDraftValue, string>>;

type WorkEntryDraftCardProps = {
  index: number;
  value: WorkEntryDraftValue;
  errors?: WorkEntryDraftErrors;
  disabled?: boolean;
  onChange: (next: WorkEntryDraftValue) => void;
  onRemove?: () => void;
};

const parseTimeToMinutes = (timeStr: string) => {
  const match = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return NaN;
  if (hours < 0 || hours > 23) return NaN;
  if (minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
};

const getShiftMinutes = ({ start, end }: { start: string; end: string }) => {
  const s = parseTimeToMinutes(start);
  const e0 = parseTimeToMinutes(end);
  if (!Number.isFinite(s) || !Number.isFinite(e0)) return null;
  if (e0 === s) return null;
  const e = e0 < s ? e0 + 24 * 60 : e0;
  return e - s;
};

const formatPrettyDate = (iso: string) => {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );
};

const formatPrettyTime = (value: string) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return value;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const isWeekend = (iso: string) => {
  if (!iso) return false;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const getAutoPayRate = (iso: string) => (isWeekend(iso) ? 15 : 13);

export default function WorkEntryDraftCard({ index, value, errors, disabled, onChange, onRemove }: WorkEntryDraftCardProps) {
  const [openDate, setOpenDate] = React.useState(false);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  const autoRate = React.useMemo(() => getAutoPayRate(value.date), [value.date]);
  const effectiveRate = React.useMemo(() => {
    const raw = String(value.pay_rate || "").trim();
    if (!raw) return autoRate;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : autoRate;
  }, [autoRate, value.pay_rate]);

  const breakHours = React.useMemo(() => {
    const v = Number(value.break_time || 0);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }, [value.break_time]);

  const includeMeal = breakHours > 0;
  const mealAllowance = includeMeal ? 4.5 : 0;

  const totalHours = React.useMemo(() => {
    const minutes = getShiftMinutes({ start: value.start_time, end: value.end_time });
    if (minutes === null) return null;
    return minutes / 60;
  }, [value.start_time, value.end_time]);

  const payableHours = React.useMemo(() => {
    if (totalHours === null) return null;
    const ph = totalHours - breakHours;
    if (!Number.isFinite(ph) || ph < 0) return null;
    return ph;
  }, [totalHours, breakHours]);

  const payPreview = React.useMemo(() => {
    if (payableHours === null) return null;
    return payableHours * effectiveRate + mealAllowance;
  }, [effectiveRate, mealAllowance, payableHours]);

  const showError = Boolean(errors && Object.values(errors).some(Boolean));
  const errorText = errors?.date || errors?.start_time || errors?.end_time || errors?.break_time || errors?.pay_rate || "";

  const headerLine = React.useMemo(() => {
    const d = value.date ? formatPrettyDate(value.date) : "";
    const s = value.start_time ? formatPrettyTime(value.start_time) : "";
    const e = value.end_time ? formatPrettyTime(value.end_time) : "";
    if (!d && !s && !e) return "";
    const t = s && e ? `${s} - ${e}` : s ? `${s}` : e ? `${e}` : "";
    const startMinutes = parseTimeToMinutes(value.start_time);
    const endMinutes = parseTimeToMinutes(value.end_time);
    const overnight =
      Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && endMinutes < startMinutes ? "+1 day" : "";
    return [d, t, overnight].filter(Boolean).join(" • ");
  }, [value.date, value.end_time, value.start_time]);

  return (
    <div className="rounded-card border border-trackify-border bg-trackify-surface p-5 shadow-[0_1px_0_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-trackify-text">Entry {index + 1}</div>
          <div className="mt-1 text-xs text-trackify-muted">{headerLine || "Select date and times"}</div>
        </div>
        {onRemove ? (
          <Button type="button" variant="secondary" onClick={onRemove} disabled={disabled} className="h-9">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setOpenDate(true)}
          disabled={disabled}
          className={cn(
            "group flex w-full items-center justify-between rounded-control border bg-trackify-surface2 px-4 py-4 text-left transition-colors",
            "border-trackify-border hover:border-trackify-border2 hover:bg-trackify-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15",
            errors?.date ? "border-white/25" : ""
          )}
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Date</div>
            <div className="mt-1 text-sm font-medium text-trackify-text">{value.date ? formatPrettyDate(value.date) : "Select date"}</div>
          </div>
          <Calendar className="h-5 w-5 text-trackify-muted group-hover:text-trackify-text" />
        </button>

        <button
          type="button"
          onClick={() => setOpenStart(true)}
          disabled={disabled}
          className={cn(
            "group flex w-full items-center justify-between rounded-control border bg-trackify-surface2 px-4 py-4 text-left transition-colors",
            "border-trackify-border hover:border-trackify-border2 hover:bg-trackify-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15",
            errors?.start_time ? "border-white/25" : ""
          )}
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Start</div>
            <div className="mt-1 text-sm font-medium text-trackify-text">
              {value.start_time ? formatPrettyTime(value.start_time) : "Select time"}
            </div>
          </div>
          <Clock className="h-5 w-5 text-trackify-muted group-hover:text-trackify-text" />
        </button>

        <button
          type="button"
          onClick={() => setOpenEnd(true)}
          disabled={disabled}
          className={cn(
            "group flex w-full items-center justify-between rounded-control border bg-trackify-surface2 px-4 py-4 text-left transition-colors",
            "border-trackify-border hover:border-trackify-border2 hover:bg-trackify-surface2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15",
            errors?.end_time ? "border-white/25" : ""
          )}
        >
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">End</div>
            <div className="mt-1 text-sm font-medium text-trackify-text">{value.end_time ? formatPrettyTime(value.end_time) : "Select time"}</div>
          </div>
          <Clock className="h-5 w-5 text-trackify-muted group-hover:text-trackify-text" />
        </button>
      </div>

      {showError ? (
        <div className="mt-3 rounded-control border border-white/15 bg-trackify-surface2 px-4 py-3 text-sm text-trackify-text">
          {errorText}
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Break time</div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onChange({ ...value, break_time: String(Math.max(0, breakHours - 1)), meal_allowance: breakHours - 1 > 0 ? "4.5" : "0" })}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-control border border-trackify-border bg-trackify-surface text-trackify-text transition-colors hover:bg-trackify-surface2 disabled:opacity-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold text-trackify-text tabular-nums">{breakHours}</div>
              <div className="text-xs text-trackify-muted">hours</div>
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...value, break_time: String(breakHours + 1), meal_allowance: "4.5" })}
              disabled={disabled}
              className="flex h-10 w-10 items-center justify-center rounded-control border border-trackify-border bg-trackify-surface text-trackify-text transition-colors hover:bg-trackify-surface2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Pay rate</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-semibold text-trackify-text tabular-nums">${effectiveRate.toFixed(2)}</div>
              <div className="rounded-full border border-trackify-border bg-trackify-surface px-2 py-1 text-[11px] text-trackify-muted">
                {String(value.pay_rate || "").trim() ? "Manual" : "Auto"}
              </div>
            </div>
            <input
              type="number"
              min={0}
              step={0.01}
              value={value.pay_rate}
              onChange={(e) => onChange({ ...value, pay_rate: e.target.value })}
              disabled={disabled}
              placeholder={String(autoRate)}
              className="h-10 w-24 rounded-control border border-trackify-border bg-trackify-surface px-3 text-sm text-trackify-text placeholder:text-trackify-muted2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-text/15 focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg disabled:opacity-50"
            />
          </div>
          <div className="mt-1 text-xs text-trackify-muted2">Leave blank for auto</div>
        </div>

        <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Meal allowance</div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-lg font-semibold text-trackify-text tabular-nums">{includeMeal ? `$${mealAllowance.toFixed(2)}` : "—"}</div>
            <div className="text-xs text-trackify-muted">{includeMeal ? "Included" : "No break"}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Total hours</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-trackify-text tabular-nums">{totalHours === null ? "—" : totalHours.toFixed(2)}</div>
          <div className="mt-1 text-xs text-trackify-muted2">Calculated from start/end</div>
        </div>
        <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
          <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Total pay preview</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-trackify-text tabular-nums">{payPreview === null ? "—" : `$${payPreview.toFixed(2)}`}</div>
          <div className="mt-1 text-xs text-trackify-muted2">Final values are calculated on save</div>
        </div>
      </div>

      <div className="mt-3 rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
        <div className="text-xs font-medium uppercase tracking-wide text-trackify-muted">Notes (optional)</div>
        <div className="mt-2">
          <Textarea
            value={value.notes}
            onChange={(e) => onChange({ ...value, notes: e.target.value })}
            placeholder="Add notes for this shift"
            className="min-h-[92px]"
          />
        </div>
      </div>

      <DatePickerModal
        open={openDate}
        value={value.date}
        onChange={(iso) => onChange({ ...value, date: iso })}
        onClose={() => setOpenDate(false)}
      />
      <TimePickerModal
        open={openStart}
        value={value.start_time}
        onChange={(t) => onChange({ ...value, start_time: t })}
        onClose={() => setOpenStart(false)}
        title="Start time"
      />
      <TimePickerModal
        open={openEnd}
        value={value.end_time}
        onChange={(t) => onChange({ ...value, end_time: t })}
        onClose={() => setOpenEnd(false)}
        title="End time"
      />
    </div>
  );
}
