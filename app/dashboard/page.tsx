import { ArrowUpRight, Database, FileStack, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ingestionRuns, libraryDocuments, retrievalSources } from "@/lib/demo-data";
import { getBackendHealth } from "@/lib/api";

const statCards = [
  {
    label: "Documents indexed",
    value: "148",
    detail: "+12 this week",
    icon: FileStack
  },
  {
    label: "Retrieval precision@5",
    value: "0.84",
    detail: "demo target",
    icon: ShieldCheck
  },
  {
    label: "Active ingestion jobs",
    value: "3",
    detail: "Modal-backed soon",
    icon: Database
  },
  {
    label: "Answer mode",
    value: "Grounded",
    detail: "citations required",
    icon: Sparkles
  }
];

export default async function DashboardPage() {
  const health = await getBackendHealth();

  return (
    <PageShell className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <CardHeader className="space-y-5">
            <Badge variant="success" className="w-fit">
              Phase 1 UI Shell
            </Badge>
            <div className="space-y-3">
              <CardTitle className="font-serif text-4xl text-white">
                A financial RAG workspace that already feels live.
              </CardTitle>
              <CardDescription className="max-w-2xl text-slate-300">
                The dashboard is built around the workflows we’ll implement in later phases:
                ingestion, indexing, retrieval diagnostics, source-grounded answers, and period-over-period analysis.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge variant="secondary" className="bg-white/10 text-white">
                API {health ? "connected" : "offline"}
              </Badge>
              <span>
                {health
                  ? `DB ${health.database} · env ${health.environment} · v${health.version}`
                  : "Start the FastAPI backend to enable live document and health data."}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" asChild>
                <Link href="/documents">
                  Upload documents
                </Link>
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                Open retrieval page
              </Button>
            </div>
          </CardHeader>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="pt-3 text-3xl">{stat.value}</CardTitle>
                </div>
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700">
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500">{stat.detail}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent ingestion runs</CardTitle>
            <CardDescription>Job states and quality checkpoints that later phases will wire to Modal and FastAPI.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ingestionRuns.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {job.company} · {job.filing}
                  </div>
                  <div className="text-sm text-slate-500">
                    {job.status} · {job.sections} section groups · updated {job.updatedAt}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View job
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top source chunks in the current demo answer</CardTitle>
            <CardDescription>Previewing the citation-driven QA experience that Phase 6 and Phase 7 will make fully functional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {retrievalSources.map((source) => (
              <div key={source.chunkId} className="rounded-[24px] border border-slate-200/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{source.title}</div>
                    <div className="text-xs text-slate-500">
                      {source.company} · {source.filingType} · {source.filingDate}
                    </div>
                  </div>
                  <Badge variant="secondary">score {source.score.toFixed(2)}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{source.excerpt}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Document library snapshot</CardTitle>
            <CardDescription>This will become the authenticated document workspace in later phases.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {libraryDocuments.map((doc) => (
              <div key={doc.title} className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-4">
                <div className="text-sm font-semibold text-slate-900">{doc.title}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {doc.company} · {doc.filingType} · {doc.period}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
