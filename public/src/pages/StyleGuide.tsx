import Button from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import Input from "@/components/Input";

const tokenSwatches = [
  { name: "Background", value: "#0A0A0A", className: "bg-trackify-bg" },
  { name: "Surface/Card", value: "#181818", className: "bg-trackify-surface" },
  { name: "Border", value: "#2A2A2A", className: "bg-trackify-border" },
  { name: "Text", value: "#FFFFFF", className: "bg-trackify-text" },
  { name: "Muted", value: "#A1A1A1", className: "bg-trackify-muted" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-10">
      <div className="mb-3 text-lg font-semibold text-trackify-text">{title}</div>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="text-sm text-trackify-muted">
          Sections: Colors · Typography · Buttons · Inputs · Cards & layout
        </div>
        <div className="flex items-center gap-2">
          <a className="text-sm text-trackify-muted hover:underline" href="#colors">
            Colors
          </a>
          <a className="text-sm text-trackify-muted hover:underline" href="#typography">
            Typography
          </a>
          <a className="text-sm text-trackify-muted hover:underline" href="#buttons">
            Buttons
          </a>
          <a className="text-sm text-trackify-muted hover:underline" href="#inputs">
            Inputs
          </a>
          <a className="text-sm text-trackify-muted hover:underline" href="#cards">
            Cards
          </a>
        </div>
      </div>

      <Section id="colors" title="Colors">
        <div className="grid grid-cols-5 gap-4">
          {tokenSwatches.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-5">
                <div className="h-14 w-full rounded-control border border-trackify-border">
                  <div className={`${t.className} h-full w-full rounded-control`} />
                </div>
                <div className="mt-3 text-sm font-medium text-trackify-text">{t.name}</div>
                <div className="mt-1 text-xs text-trackify-muted">{t.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="typography" title="Typography">
        <Card>
          <CardContent className="pt-5">
            <div className="space-y-4">
              <div>
                <div className="text-xs text-trackify-muted">H1 (24–28)</div>
                <div className="text-2xl font-semibold text-trackify-text">Trackify UI Foundation</div>
              </div>
              <div>
                <div className="text-xs text-trackify-muted">H2 (18–20)</div>
                <div className="text-lg font-semibold text-trackify-text">Monochrome components</div>
              </div>
              <div>
                <div className="text-xs text-trackify-muted">Body (14–16)</div>
                <div className="text-sm text-trackify-muted">
                  Clean spacing, subtle borders, and consistent hierarchy for a premium minimal feel.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section id="buttons" title="Buttons">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section id="inputs" title="Inputs">
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Default</div>
                <Input placeholder="Type here" />
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Focused</div>
                <Input autoFocus placeholder="Focus ring" />
              </div>
              <div>
                <div className="mb-2 text-xs text-trackify-muted">Error (monochrome)</div>
                <Input state="error" placeholder="Invalid value" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section id="cards" title="Cards & layout">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-trackify-text">Card spacing</div>
              <div className="mt-1 text-sm text-trackify-muted">Normal density</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                  Example content block
                </div>
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-4 py-3 text-sm text-trackify-muted">
                  Example content block
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-trackify-text">Dense variant</div>
              <div className="mt-1 text-sm text-trackify-muted">Tighter vertical rhythm</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-3 py-2 text-sm text-trackify-muted">
                  Dense content block
                </div>
                <div className="rounded-control border border-trackify-border bg-trackify-bg px-3 py-2 text-sm text-trackify-muted">
                  Dense content block
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-trackify-text">2-column form (desktop)</div>
              <div className="mt-1 text-sm text-trackify-muted">Layout example</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-xs text-trackify-muted">Full name</div>
                  <Input placeholder="Jane Doe" />
                </div>
                <div>
                  <div className="mb-2 text-xs text-trackify-muted">Email</div>
                  <Input placeholder="jane@trackify.app" />
                </div>
                <div className="col-span-2">
                  <div className="mb-2 text-xs text-trackify-muted">Notes</div>
                  <Input placeholder="A wider field" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-sm font-medium text-trackify-text">3-column cards (desktop)</div>
              <div className="mt-1 text-sm text-trackify-muted">Grid example</div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-control border border-trackify-border bg-trackify-bg px-3 py-3 text-sm text-trackify-muted"
                  >
                    Card {i + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </div>
  );
}

