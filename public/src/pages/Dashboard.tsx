import Button from "@/components/Button";
import CalendarMonth from "@/components/CalendarMonth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import * as React from "react";

import { fetchCalendarDates, fetchDateDetails, fetchMonthlySummary } from "@/services/dashboardService";

const kpis = [
  { label: "Total Shifts", value: "—", helper: "This month" },
  { label: "Payable Hours", value: "—", helper: "After breaks" },
  { label: "Total Pay", value: "—", helper: "Estimated" },
];

const pad2 = (n: number) => String(n).padStart(2, "0");

const isSameMonth = (isoDate: string, month: number, year: number) => {
  return isoDate.startsWith(`${year}-${pad2(month)}-`);
};

type MonthlySummary = {
  totalShifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type CalendarDate = { date: string; shifts: number };

type WorkEntryRow = {
  id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  total_hours: number | null;
  break_time: number | null;
  payable_hours: number | null;
  total_pay: number | null;
  meal_allowance: number | null;
  notes: string | null;
};

export default function Dashboard() {
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState(() => ({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  }));

  const [selectedDate, setSelectedDate] = React.useState(() => {
    const local = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    return local.toISOString().slice(0, 10);
  });

  const [summary, setSummary] = React.useState<MonthlySummary | null>(null);
  const [calendarDates, setCalendarDates] = React.useState<CalendarDate[]>([]);
  const [dayEntries, setDayEntries] = React.useState<WorkEntryRow[]>([]);

  const [isMonthLoading, setIsMonthLoading] = React.useState(false);
  const [isDayLoading, setIsDayLoading] = React.useState(false);
  const [monthError, setMonthError] = React.useState<string>("");
  const [dayError, setDayError] = React.useState<string>("");

  const indicatorSet = React.useMemo(() => {
    return new Set(calendarDates.map((d) => d.date));
  }, [calendarDates]);

  React.useEffect(() => {
    if (!isSameMonth(selectedDate, view.month, view.year)) {
      setSelectedDate(`${view.year}-${pad2(view.month)}-01`);
    }
  }, [selectedDate, view.month, view.year]);

  React.useEffect(() => {
    const controller = new AbortController();

    setIsMonthLoading(true);
    setMonthError("");

    Promise.all([
      fetchMonthlySummary({ month: view.month, year: view.year, signal: controller.signal }),
      fetchCalendarDates({ month: view.month, year: view.year, signal: controller.signal }),
    ])
      .then(([summaryRes, calendarRes]) => {
        setSummary(summaryRes);
        setCalendarDates(Array.isArray(calendarRes?.dates) ? calendarRes.dates : []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setMonthError(err?.response?.data?.error?.message || err?.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsMonthLoading(false);
      });

    return () => controller.abort();
  }, [view.month, view.year]);

  React.useEffect(() => {
    const controller = new AbortController();

    setIsDayLoading(true);
    setDayError("");

    fetchDateDetails({ date: selectedDate, signal: controller.signal })
      .then((res) => {
        setDayEntries(Array.isArray(res?.workEntries) ? res.workEntries : []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setDayError(err?.response?.data?.error?.message || err?.message || "Failed to load date details");
        setDayEntries([]);
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsDayLoading(false);
      });

    return () => controller.abort();
  }, [selectedDate]);

  const selectedLabel = React.useMemo(() => {
    const date = new Date(`${selectedDate}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {kpis.map((kpi) => {
          const value =
            kpi.label === "Total Shifts"
              ? summary?.totalShifts ?? "—"
              : kpi.label === "Payable Hours"
                ? summary?.totalPayableHours ?? "—"
                : kpi.label === "Total Pay"
                  ? summary?.totalPay ?? "—"
                  : "—";

          return (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight text-trackify-text tabular-nums">{value}</div>
              <div className="mt-1 text-sm text-trackify-muted">{kpi.helper}</div>
            </CardContent>
          </Card>
          );
        })}
      </section>

      {monthError ? (
        <div className="rounded-control border border-trackify-border bg-trackify-surface px-5 py-4 text-sm text-trackify-muted">
          {monthError}
        </div>
      ) : null}

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-trackify-text">Monthly overview</div>
                <div className="mt-1 text-sm text-trackify-muted">
                  Click a date to preview shift details
                </div>
              </div>
              <Button variant="secondary" disabled>
                Export (soon)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isMonthLoading ? (
              <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4 text-sm text-trackify-muted">
                Loading month…
              </div>
            ) : null}
            <CalendarMonth
              month={view.month}
              year={view.year}
              selectedDate={selectedDate}
              indicators={indicatorSet}
              onSelectDate={setSelectedDate}
              onMonthChange={setView}
            />
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-trackify-text">Date details</div>
                <div className="mt-1 text-sm text-trackify-muted">{selectedLabel}</div>
              </div>
              <Button variant="secondary" disabled>
                Add entry
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dayError ? (
                <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4 text-sm text-trackify-muted">
                  {dayError}
                </div>
              ) : null}

              {isDayLoading ? (
                <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4 text-sm text-trackify-muted">
                  Loading details…
                </div>
              ) : null}

              {!isDayLoading && !dayError && dayEntries.length === 0 ? (
                <div className="rounded-control border border-trackify-border bg-trackify-surface2 px-4 py-4">
                  <div className="text-sm font-medium text-trackify-text">No shifts for this date</div>
                  <div className="mt-1 text-sm text-trackify-muted">
                    Add a work entry to see it here.
                  </div>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-control border border-trackify-border">
                <div className="grid grid-cols-[160px_1fr_120px_120px] gap-0 border-b border-trackify-border bg-trackify-surface2 px-4 py-3 text-xs font-medium text-trackify-muted">
                  <div>Time</div>
                  <div>Notes</div>
                  <div className="text-right">Hours</div>
                  <div className="text-right">Pay</div>
                </div>
                {dayEntries.length > 0
                  ? dayEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="grid grid-cols-[160px_1fr_120px_120px] items-center border-b border-trackify-border px-4 py-3 text-sm last:border-b-0"
                      >
                        <div className="text-trackify-muted">
                          {entry.start_time && entry.end_time
                            ? `${entry.start_time} — ${entry.end_time}`
                            : "—"}
                        </div>
                        <div className="text-trackify-text">{entry.notes || "—"}</div>
                        <div className="text-right text-trackify-muted">
                          {entry.total_hours ?? "—"}
                        </div>
                        <div className="text-right text-trackify-muted">
                          {entry.total_pay ?? "—"}
                        </div>
                      </div>
                    ))
                  : null}

                {!isDayLoading && !dayError && dayEntries.length === 0 ? (
                  <div className="px-4 py-5 text-sm text-trackify-muted">
                    No entries
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
