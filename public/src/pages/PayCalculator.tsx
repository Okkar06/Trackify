import * as React from "react";

import Button from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import Input from "@/components/Input";
import { fetchMonthlyPay, fetchYearlyPay } from "@/services/payService";
import { cn } from "@/utils/cn";
import { buildCsvWithSummary, downloadCsv } from "@/utils/exportCsv";

type Mode = "monthly" | "yearly";

type Totals = {
  totalShifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type MonthlyBreakdownRow = {
  date: string;
  shifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type YearlyBreakdownRow = {
  month: string;
  shifts: number;
  totalHours: number;
  totalPayableHours: number;
  totalPay: number;
};

type MonthlyResponse = {
  totals: Totals;
  breakdown: MonthlyBreakdownRow[];
};

type YearlyResponse = {
  totals: Totals;
  breakdown: YearlyBreakdownRow[];
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const getDefaultMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

const ModePill = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-control border px-3 py-2 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trackify-muted focus-visible:ring-offset-2 focus-visible:ring-offset-trackify-bg",
        active
          ? "border-trackify-border bg-trackify-text text-trackify-bg"
          : "border-trackify-border bg-trackify-surface text-trackify-text hover:bg-white/5"
      )}
    >
      {children}
    </button>
  );
};

export default function PayCalculator() {
  const defaults = React.useMemo(() => getDefaultMonthYear(), []);

  const [mode, setMode] = React.useState<Mode>("monthly");
  const [month, setMonth] = React.useState(defaults.month);
  const [year, setYear] = React.useState(defaults.year);

  const [monthly, setMonthly] = React.useState<MonthlyResponse | null>(null);
  const [yearly, setYearly] = React.useState<YearlyResponse | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  const refresh = React.useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    const task =
      mode === "monthly"
        ? fetchMonthlyPay({ month, year, signal: controller.signal }).then((res) => {
            setMonthly(res);
          })
        : fetchYearlyPay({ year, signal: controller.signal }).then((res) => {
            setYearly(res);
          });

    task
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.error?.message || err?.message || "Failed to load pay summary");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [mode, month, year]);

  React.useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  const totals = mode === "monthly" ? monthly?.totals : yearly?.totals;
  const breakdown = mode === "monthly" ? monthly?.breakdown : yearly?.breakdown;

  const onExport = () => {
    if (!totals) return;

    if (mode === "monthly") {
      const rows = (monthly?.breakdown || []).map((r) => ({
        date: r.date,
        total_shifts: r.shifts,
        total_hours: r.totalHours,
        total_payable_hours: r.totalPayableHours,
        total_pay: r.totalPay,
      }));

      const csv = buildCsvWithSummary({
        summary: [
          { label: "period", value: `monthly-${year}-${pad2(month)}` },
          { label: "total_shifts", value: totals.totalShifts },
          { label: "total_hours", value: totals.totalHours },
          { label: "total_payable_hours", value: totals.totalPayableHours },
          { label: "total_pay", value: totals.totalPay },
        ],
        rows,
      });

      downloadCsv({ filename: `trackify-pay-monthly-${year}-${pad2(month)}.csv`, csv });
      return;
    }

    const rows = (yearly?.breakdown || []).map((r) => ({
      month: r.month,
      total_shifts: r.shifts,
      total_hours: r.totalHours,
      total_payable_hours: r.totalPayableHours,
      total_pay: r.totalPay,
    }));

    const csv = buildCsvWithSummary({
      summary: [
        { label: "period", value: `yearly-${year}` },
        { label: "total_shifts", value: totals.totalShifts },
        { label: "total_hours", value: totals.totalHours },
        { label: "total_payable_hours", value: totals.totalPayableHours },
        { label: "total_pay", value: totals.totalPay },
      ],
      rows,
    });

    downloadCsv({ filename: `trackify-pay-yearly-${year}.csv`, csv });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModePill active={mode === "monthly"} onClick={() => setMode("monthly")}>
            Monthly
          </ModePill>
          <ModePill active={mode === "yearly"} onClick={() => setMode("yearly")}>
            Yearly
          </ModePill>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onExport} disabled={isLoading || !totals}>
            Export
          </Button>
          <Button variant="secondary" onClick={() => refresh()} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Filters</div>
              <div className="mt-1 text-sm text-trackify-muted">
                {mode === "monthly" ? "Monthly pay summary" : "Yearly pay summary"}
              </div>
            </div>
            <div className="text-sm text-trackify-muted">
              {mode === "monthly" ? `${year}-${pad2(month)}` : String(year)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("grid gap-4", mode === "monthly" ? "grid-cols-2" : "grid-cols-1")}>
            {mode === "monthly" ? (
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Month (1–12)</div>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value || defaults.month))}
                />
              </div>
            ) : null}
            <div>
              <div className="mb-2 text-xs text-trackify-muted">Year</div>
              <Input
                type="number"
                min={1970}
                max={2100}
                value={year}
                onChange={(e) => setYear(Number(e.target.value || defaults.year))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-trackify-text">{totals?.totalShifts ?? "—"}</div>
            <div className="mt-1 text-sm text-trackify-muted">Count</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-trackify-text">{totals?.totalHours ?? "—"}</div>
            <div className="mt-1 text-sm text-trackify-muted">Raw time</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payable hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-trackify-text">{totals?.totalPayableHours ?? "—"}</div>
            <div className="mt-1 text-sm text-trackify-muted">After breaks</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-trackify-text">{totals?.totalPay ?? "—"}</div>
            <div className="mt-1 text-sm text-trackify-muted">Estimated</div>
          </CardContent>
        </Card>
      </section>

      {error ? (
        <div className="rounded-control border border-trackify-border bg-trackify-surface px-5 py-4 text-sm text-trackify-muted">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-trackify-text">Breakdown</div>
              <div className="mt-1 text-sm text-trackify-muted">
                {mode === "monthly" ? "Grouped by date" : "Grouped by month"}
              </div>
            </div>
            <div className="text-sm text-trackify-muted">{isLoading ? "Loading…" : ""}</div>
          </div>
        </CardHeader>
        <CardContent>
          {!isLoading && !error && (!breakdown || breakdown.length === 0) ? (
            <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div className="text-sm font-medium text-trackify-text">No data</div>
              <div className="mt-1 text-sm text-trackify-muted">Add work entries to see summaries here.</div>
            </div>
          ) : null}

          {breakdown && breakdown.length > 0 ? (
            <div className="overflow-hidden rounded-control border border-trackify-border">
              <div className="grid grid-cols-[160px_90px_120px_140px_140px] gap-0 border-b border-trackify-border bg-trackify-bg px-4 py-3 text-xs font-medium text-trackify-muted">
                <div>{mode === "monthly" ? "Date" : "Month"}</div>
                <div className="text-right">Shifts</div>
                <div className="text-right">Hours</div>
                <div className="text-right">Payable</div>
                <div className="text-right">Pay</div>
              </div>
              {breakdown.map((row: any) => (
                <div
                  key={row.date || row.month}
                  className="grid grid-cols-[160px_90px_120px_140px_140px] items-center gap-0 border-b border-trackify-border px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="text-trackify-text">{row.date || row.month}</div>
                  <div className="text-right text-trackify-muted">{row.shifts}</div>
                  <div className="text-right text-trackify-muted">{row.totalHours}</div>
                  <div className="text-right text-trackify-muted">{row.totalPayableHours}</div>
                  <div className="text-right text-trackify-muted">{row.totalPay}</div>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
