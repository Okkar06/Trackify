import Button from "@/components/Button";
import CalendarMonth from "@/components/CalendarMonth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import * as React from "react";

const kpis = [
  { label: "Total Shifts", value: "—", helper: "This month" },
  { label: "Payable Hours", value: "—", helper: "After breaks" },
  { label: "Total Pay", value: "—", helper: "Estimated" },
];

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

  const mockIndicators = React.useMemo(() => {
    const set = new Set<string>();
    const y = view.year;
    const m = view.month;
    [2, 7, 12, 18, 24].forEach((d) => {
      const iso = new Date(Date.UTC(y, m - 1, d)).toISOString().slice(0, 10);
      set.add(iso);
    });
    set.add(selectedDate);
    return set;
  }, [selectedDate, view.month, view.year]);

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
      <section className="grid grid-cols-3 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle>{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-trackify-text">{kpi.value}</div>
              <div className="mt-1 text-sm text-trackify-muted">{kpi.helper}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-trackify-text">Monthly overview</div>
                <div className="mt-1 text-sm text-trackify-muted">
                  Click a date to preview shift details (mock data)
                </div>
              </div>
              <Button variant="secondary" disabled>
                Export (soon)
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarMonth
              month={view.month}
              year={view.year}
              selectedDate={selectedDate}
              indicators={mockIndicators}
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
              <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
                <div className="text-sm font-medium text-trackify-text">No shifts yet</div>
                <div className="mt-1 text-sm text-trackify-muted">
                  When you add shifts, details will appear here.
                </div>
              </div>

              <div className="overflow-hidden rounded-control border border-trackify-border">
                <div className="grid grid-cols-[160px_1fr_120px_120px] gap-0 border-b border-trackify-border bg-trackify-bg px-4 py-3 text-xs font-medium text-trackify-muted">
                  <div>Time</div>
                  <div>Notes</div>
                  <div className="text-right">Hours</div>
                  <div className="text-right">Pay</div>
                </div>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[160px_1fr_120px_120px] items-center border-b border-trackify-border px-4 py-3 text-sm last:border-b-0"
                  >
                    <div className="text-trackify-muted">—</div>
                    <div className="text-trackify-text">—</div>
                    <div className="text-right text-trackify-muted">—</div>
                    <div className="text-right text-trackify-muted">—</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
