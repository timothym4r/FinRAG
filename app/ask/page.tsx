import { BarChart3, FileSearch, Quote } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { retrievalSources } from "@/lib/demo-data";

export default function AskPage() {
  return (
    <DashboardShell pathname="/ask">
      <PageShell className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="bg-white/90">
            <CardHeader>
              <Badge className="w-fit">Ask the company corpus</Badge>
              <CardTitle className="pt-4 font-serif text-3xl">
                Why does recent NVIDIA guidance emphasize concentration risk?
              </CardTitle>
              <CardDescription>
                Answer generation is backend-controlled in later phases. For now, this screen establishes the final product interaction pattern.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">Concise answer</div>
                  <Badge variant="success">Evidence-backed</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The company appears to be broadening concentration risk disclosure because a larger share of growth depends on a small number of hyperscale and channel partners, and management is also linking demand assumptions to export controls and deployment timing
                  <span className="text-emerald-700"> [1]</span>
                  <span className="text-emerald-700"> [2]</span>
                  <span className="text-emerald-700"> [3]</span>.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Retriever mode", value: "Dense first", icon: FileSearch },
                  { label: "Rerank", value: "Enabled", icon: BarChart3 },
                  { label: "Confidence", value: "0.87", icon: Quote }
                ].map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-slate-200/80 p-4">
                    <item.icon className="h-4 w-4 text-emerald-700" />
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button>Expanded answer</Button>
                <Button variant="outline">Ask this document</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source chunks</CardTitle>
              <CardDescription>Inline citations map to chunk IDs and source previews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {retrievalSources.map((source, index) => (
                <div key={source.chunkId} className="rounded-[24px] border border-slate-200/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        [{index + 1}] {source.title}
                      </div>
                      <div className="text-xs text-slate-500">
                        {source.company} · {source.filingType} · {source.filingDate} · page {source.page}
                      </div>
                    </div>
                    <Badge variant="secondary">{source.chunkId}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{source.excerpt}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </PageShell>
    </DashboardShell>
  );
}

