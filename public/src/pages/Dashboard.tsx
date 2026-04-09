import Button from "@/components/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

const kpis = [
  { label: "Total Shifts", value: "—", helper: "This month" },
  { label: "Payable Hours", value: "—", helper: "After breaks" },
  { label: "Total Pay", value: "—", helper: "Estimated" },
];

export default function Dashboard() {
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
                <div className="text-sm font-medium text-trackify-text">Recent activity</div>
                <div className="mt-1 text-sm text-trackify-muted">Latest shifts will show here</div>
              </div>
              <Button variant="secondary" disabled>
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-control border border-trackify-border">
              <div className="grid grid-cols-[160px_1fr_140px_140px] gap-0 border-b border-trackify-border bg-trackify-bg px-4 py-3 text-xs font-medium text-trackify-muted">
                <div>Date</div>
                <div>Shift</div>
                <div className="text-right">Hours</div>
                <div className="text-right">Pay</div>
              </div>
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[160px_1fr_140px_140px] items-center border-b border-trackify-border px-4 py-3 text-sm last:border-b-0"
                >
                  <div className="text-trackify-muted">—</div>
                  <div className="text-trackify-text">Start — End</div>
                  <div className="text-right text-trackify-muted">—</div>
                  <div className="text-right text-trackify-muted">—</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <div className="text-sm font-medium text-trackify-text">Notes</div>
            <div className="mt-1 text-sm text-trackify-muted">
              Your insights and reminders will appear here
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-6 rounded-control border border-trackify-border bg-trackify-bg px-4 py-4">
              <div>
                <div className="text-sm font-medium text-trackify-text">No notes yet</div>
                <div className="mt-1 text-sm text-trackify-muted">Add quick notes after shifts</div>
              </div>
              <Button variant="secondary" disabled>
                Add note
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

