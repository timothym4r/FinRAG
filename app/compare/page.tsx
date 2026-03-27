import { ArrowRightLeft, Columns2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compareRows } from "@/lib/demo-data";

export default function ComparePage() {
  return (
    <DashboardShell pathname="/compare">
      <PageShell className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[32px] border border-slate-200/70 bg-white/90 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="secondary" className="w-fit">
              Compare periods
            </Badge>
            <h1 className="mt-4 font-serif text-3xl text-slate-950">
              Narrative diffs across reporting periods
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              This view highlights how risk disclosures and management commentary evolve between filings.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <ArrowRightLeft className="h-4 w-4" />
            NVIDIA 10-K FY2025 vs FY2024
          </div>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Columns2 className="h-5 w-5 text-emerald-700" />
              <div>
                <CardTitle>Section-by-section change view</CardTitle>
                <CardDescription>Phase 7 will connect this to retrieved sections and citation-linked diffs.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {compareRows.map((row) => (
              <div key={row.section} className="grid gap-4 rounded-[24px] border border-slate-200/80 p-5 lg:grid-cols-[0.22fr_0.39fr_0.39fr]">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Section</div>
                  <div className="mt-2 text-base font-semibold text-slate-900">{row.section}</div>
                  <Badge variant="outline" className="mt-3">
                    {row.delta}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current period</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{row.current}</p>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Previous period</div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{row.previous}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageShell>
    </DashboardShell>
  );
}

