import * as React from "react";
import { Calendar, Clock, Minus, Plus } from "lucide-react";

import Button from "@/components/Button";
import Textarea from "@/components/Textarea";
import DatePickerModal from "@/components/DatePickerModal";
import TimePickerModal from "@/components/TimePickerModal";
import { cn } from "@/utils/cn";

type WorkEntryPayload = {
  date: string;
  start_time: string;
  end_time: string;
  break_time: number;
  pay_rate?: number;
  meal_allowance?: number;
  notes?: string;
};

type WorkEntryFormProps = {
  isSaving: boolean;
  onSubmit: (payload: WorkEntryPayload) => void | Promise<void>;
  onReset?: () => void;
  onAddAnother?: () => void;
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

export default function WorkEntryForm({ isSaving, onSubmit, onReset, onAddAnother }: WorkEntryFormProps) {
  const [date, setDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [breakTime, setBreakTime] = React.useState(1);
  const [payRateOverride, setPayRateOverride] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");

  const [openDate, setOpenDate] = React.useState(false);
  const [openStart, setOpenStart] = React.useState(false);
  const [openEnd, setOpenEnd] = React.useState(false);

  const [errors, setErrors] = React.useState<{ date?: string; time?: string }>({});

  const autoPayRate = React.useMemo(() => getAutoPayRate(date), [date]);
  const payRate = React.useMemo(() => {
    const raw = String(payRateOverride || "").trim();
    if (!raw) return autoPayRate;
    const v = Number(raw);
    return Number.isFinite(v) && v >= 0 ? v : autoPayRate;
  }, [autoPayRate, payRateOverride]);
  const includeMeal = breakTime > 0;
  const mealAllowance = includeMeal ? 4.5 : 0;

  const totalHours = React.useMemo(() => {
    const s = parseTimeToMinutes(startTime);
    const e = parseTimeToMinutes(endTime);
    if (!Number.isFinite(s) || !Number.isFinite(e)) return null;
    if (e <= s) return null;
    return (e - s) / 60;
  }, [startTime, endTime]);

  const payableHours = React.useMemo(() => {
    if (totalHours === null) return null;
    const ph = totalHours - breakTime;
    if (!Number.isFinite(ph) || ph < 0) return null;
    return ph;
  }, [totalHours, breakTime]);

  const totalPayPreview = React.useMemo(() => {
    if (payableHours === null) return null;
    return payableHours * payRate + mealAllowance;
  }, [payableHours, payRate, mealAllowance]);

  const reset = () => {
    setDate("");
    setStartTime("");
    setEndTime("");
    setBreakTime(1);
    setPayRateOverride("");
    setNotes("");
    setErrors({});
    onReset?.();
  };

  const validate = () => {
    const next: { date?: string; time?: string } = {};
    if (!date) next.date = "Please select a date";
    if (!startTime || !endTime) next.time = "Please select your start and end time";
    const s = parseTimeToMinutes(startTime);
    const e = parseTimeToMinutes(endTime);
    if (startTime && endTime && (!Number.isFinite(s) || !Number.isFinite(e))) next.time = "Please choose a valid time";
    else if (startTime && endTime && e <= s) next.time = "End time should be after start time";
    if (totalHours !== null && breakTime > totalHours) next.time = "Break time cannot be longer than the shift";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const headerLine = React.useMemo(() => {
    const d = date ? formatPrettyDate(date) : "";
    const s = startTime ? formatPrettyTime(startTime) : "";
    const e = endTime ? formatPrettyTime(endTime) : "";
    if (!d && !s && !e) return "";
    const t = s && e ? `${s} - ${e}` : s ? `${s}` : e ? `${e}` : "";
    return [d, t].filter(Boolean).join(" • ");
  }, [date, startTime, endTime]);

  const onIncBreak = () => setBreakTime((v) => v + 1);
  const onDecBreak = () => setBreakTime((v) => Math.max(0, v - 1));

  const onSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: WorkEntryPayload = {
      date,
      start_time: startTime,
      end_time: endTime,
      break_time: breakTime,
      ...(String(payRateOverride || "").trim() ? { pay_rate: payRate } : {}),
      ...(includeMeal ? { meal_allowance: mealAllowance } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    await onSubmit(payload);
    reset();
  };

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#0A0F1A]/70 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-white">New work entry</div>
          <div className="mt-1 text-sm text-white/60">Pick date and times like an app</div>
        </div>
        {headerLine ? (
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            {headerLine}
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmitInternal} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpenDate(true)}
            className={cn(
              "group flex w-full items-center justify-between rounded-[18px] border bg-white/5 px-4 py-4 text-left transition-all",
              "border-white/10 hover:border-sky-400/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40",
              errors.date ? "border-rose-400/40" : ""
            )}
          >
            <div>
              <div className="text-xs text-white/60">Date</div>
              <div className="mt-1 text-sm font-medium text-white">{date ? formatPrettyDate(date) : "Select date"}</div>
            </div>
            <Calendar className="h-5 w-5 text-white/60 group-hover:text-sky-200" />
          </button>

          <button
            type="button"
            onClick={() => setOpenStart(true)}
            className={cn(
              "group flex w-full items-center justify-between rounded-[18px] border bg-white/5 px-4 py-4 text-left transition-all",
              "border-white/10 hover:border-sky-400/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40",
              errors.time ? "border-rose-400/40" : ""
            )}
          >
            <div>
              <div className="text-xs text-white/60">Start</div>
              <div className="mt-1 text-sm font-medium text-white">
                {startTime ? formatPrettyTime(startTime) : "Select time"}
              </div>
            </div>
            <Clock className="h-5 w-5 text-white/60 group-hover:text-sky-200" />
          </button>

          <button
            type="button"
            onClick={() => setOpenEnd(true)}
            className={cn(
              "group flex w-full items-center justify-between rounded-[18px] border bg-white/5 px-4 py-4 text-left transition-all",
              "border-white/10 hover:border-sky-400/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40",
              errors.time ? "border-rose-400/40" : ""
            )}
          >
            <div>
              <div className="text-xs text-white/60">End</div>
              <div className="mt-1 text-sm font-medium text-white">{endTime ? formatPrettyTime(endTime) : "Select time"}</div>
            </div>
            <Clock className="h-5 w-5 text-white/60 group-hover:text-sky-200" />
          </button>
        </div>

        {(errors.date || errors.time) && (
          <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {(errors.date || errors.time) as string}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs text-white/60">Break time</div>
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onDecBreak}
                className="flex h-10 w-10 items-center justify-center rounded-control border border-white/10 bg-white/5 text-white/80 transition-all hover:border-sky-400/30 hover:bg-white/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-center">
                <div className="text-lg font-semibold text-white tabular-nums">{breakTime}</div>
                <div className="text-xs text-white/60">hours</div>
              </div>
              <button
                type="button"
                onClick={onIncBreak}
                className="flex h-10 w-10 items-center justify-center rounded-control border border-white/10 bg-white/5 text-white/80 transition-all hover:border-sky-400/30 hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs text-white/60">Pay rate</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <div className="text-lg font-semibold text-white tabular-nums">${payRate.toFixed(2)}</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
                  {String(payRateOverride || "").trim() ? "Manual" : "Auto"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={payRateOverride}
                  onChange={(e) => setPayRateOverride(e.target.value)}
                  placeholder={String(autoPayRate)}
                  className="w-24 rounded-control border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/40"
                />
              </div>
            </div>
            <div className="mt-1 text-xs text-white/50">Public holidays are also 15 (auto)</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs text-white/60">Meal allowance</div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-lg font-semibold text-white tabular-nums">{includeMeal ? `$${mealAllowance.toFixed(2)}` : "—"}</div>
              <div className="text-xs text-white/60">{includeMeal ? "Included" : "No break"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs text-white/60">Total hours</div>
            <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
              {totalHours === null ? "—" : totalHours.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-white/50">Calculated from start/end</div>
          </div>
          <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-xs text-white/60">Total pay preview</div>
            <div className="mt-2 text-2xl font-semibold text-white tabular-nums">
              {totalPayPreview === null ? "—" : `$${totalPayPreview.toFixed(2)}`}
            </div>
            <div className="mt-1 text-xs text-white/50">Final values are calculated on save</div>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-4">
          <div className="text-xs text-white/60">Notes (optional)</div>
          <div className="mt-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this shift"
              className="min-h-[92px] bg-transparent text-white placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-white text-black transition-all hover:bg-white/90 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.35),0_0_24px_rgba(56,189,248,0.25)]"
          >
            {isSaving ? "Creating…" : "Create Entry"}
          </Button>
          <Button type="button" variant="secondary" onClick={reset} disabled={isSaving} className="border-white/10">
            Reset
          </Button>
          {onAddAnother ? (
            <Button type="button" variant="secondary" onClick={onAddAnother} disabled={isSaving} className="border-white/10">
              Add Another Entry
            </Button>
          ) : null}
        </div>
      </form>

      <DatePickerModal open={openDate} value={date} onChange={setDate} onClose={() => setOpenDate(false)} />
      <TimePickerModal open={openStart} value={startTime} onChange={setStartTime} onClose={() => setOpenStart(false)} title="Start time" />
      <TimePickerModal open={openEnd} value={endTime} onChange={setEndTime} onClose={() => setOpenEnd(false)} title="End time" />
    </div>
  );
}
