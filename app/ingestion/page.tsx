import { Clock3, FileUp, Sparkles } from "lucide-react";

import { DashboardShell } from "@/components/dashboard-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ingestionRuns } from "@/lib/demo-data";

export default function IngestionPage() {
  return (
    <DashboardShell pathname="/ingestion">
      <PageShell className="space-y-6">
        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="bg-slate-950 text-white">
            <CardHeader>
              <Badge variant="success" className="w-fit">
                Ingestion control plane
              </Badge>
              <CardTitle className="pt-4 font-serif text-3xl text-white">
                Upload, parse, section, and index investor documents.
              </CardTitle>
              <CardDescription className="text-slate-300">
                This screen is intentionally ready for a real job orchestration backend in later phases.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="secondary">
                <FileUp className="h-4 w-4" />
                New upload batch
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
                Configure pipeline
              </Button>
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Queued", value: "06", icon: Clock3 },
              { label: "Running", value: "03", icon: Sparkles },
              { label: "Succeeded", value: "41", icon: FileUp }
            ].map((item) => (
              <Card key={item.label}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardDescription>{item.label}</CardDescription>
                    <item.icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <CardTitle className="pt-4 text-3xl">{item.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Current jobs</CardTitle>
            <CardDescription>Section-aware chunking and embedding states will be wired in Phase 4 and Phase 5.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ingestionRuns.map((job) => (
              <div key={job.id} className="rounded-[24px] border border-slate-200/80 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {job.company} · {job.filing}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {job.id} · {job.sections} sections extracted
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{job.status}</Badge>
                    <div className="text-sm text-slate-500">{job.updatedAt}</div>
                  </div>
                </div>
                <Progress className="mt-4" value={job.progress} />
              </div>
            ))}
          </CardContent>
        </Card>
      </PageShell>
    </DashboardShell>
  );
}

