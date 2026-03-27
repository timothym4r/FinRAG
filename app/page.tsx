import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  DatabaseZap,
  FileStack,
  SearchCode
} from "lucide-react";

import { Logo } from "@/components/logo";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { retrievalSources } from "@/lib/demo-data";

const featureCards = [
  {
    title: "Grounded financial answers",
    description:
      "Every answer is anchored to retrieved filings, transcripts, and investor materials with inline evidence.",
    icon: SearchCode
  },
  {
    title: "Metadata-aware ingestion",
    description:
      "Chunking preserves company, filing type, filing date, section, page, and chunk lineage for trustworthy retrieval.",
    icon: FileStack
  },
  {
    title: "Production retrieval stack",
    description:
      "Dense retrieval, optional hybrid search, reranking, diagnostics, and document-level drill-downs are built into the platform.",
    icon: DatabaseZap
  }
];

const proofPoints = [
  "SEC filings, earnings call transcripts, and investor PDFs in one corpus",
  "Document-level and company-corpus answer modes",
  "Confidence diagnostics with source previews",
  "Clean app shell ready for backend, auth, and ingestion phases"
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-grid bg-[size:64px_64px] opacity-40" />
      <PageShell className="relative">
        <header className="flex items-center justify-between gap-4 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">View Demo</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">
                Launch Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-12 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-24">
          <div className="space-y-8">
            <Badge className="w-fit">
              Financial Retrieval-Augmented Generation
            </Badge>
            <div className="space-y-6">
              <h1 className="max-w-4xl text-balance font-serif text-5xl tracking-tight text-slate-950 md:text-7xl">
                Analyst-grade answers from filings, earnings, and investor documents.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                FinRAG is a production-style financial QA system that ingests
                SEC filings and investor materials, retrieves evidence-rich
                chunks, reranks context, and generates grounded answers with
                citations.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Explore Product Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ask">Preview Retrieval Experience</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {proofPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur"
                >
                  <CircleCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-slate-600">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 bg-slate-950 text-white shadow-glow">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Retrieval Preview
                  </div>
                  <CardTitle className="mt-2 text-white">
                    Why did NVIDIA discuss concentration risk more explicitly?
                  </CardTitle>
                </div>
                <Badge variant="success">High confidence</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-sm leading-7 text-slate-200">
                  NVIDIA’s recent filing expands concentration risk language
                  across both the risk factors and financial statement notes,
                  with emphasis on hyperscale customer concentration, receivables
                  exposure, and export-control-driven demand shifts
                  <span className="text-emerald-300"> [1]</span>
                  <span className="text-emerald-300"> [2]</span>
                  <span className="text-emerald-300"> [3]</span>.
                </div>
              </div>
              <div className="space-y-3">
                {retrievalSources.map((source, index) => (
                  <div
                    key={source.chunkId}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          [{index + 1}] {source.title}
                        </div>
                        <div className="text-xs text-slate-400">
                          {source.company} · {source.filingType} · page {source.page}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-300">
                        score {source.score.toFixed(2)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {source.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-8 py-10">
          <SectionHeading
            eyebrow="Platform"
            title="Built like a real financial intelligence product"
            description="The first phase establishes the visual language and user flow that later backend and retrieval phases will plug directly into."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="h-full">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="pt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-[#f9fafb]">
            <CardHeader>
              <Badge variant="secondary" className="w-fit">
                Demo-ready narrative
              </Badge>
              <CardTitle className="pt-4 text-2xl">
                A recruiter-friendly project surface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
              <p>
                The UI is intentionally shaped around real ML product workflows:
                document ingestion, retrieval diagnostics, document library
                exploration, and comparative analysis across reporting periods.
              </p>
              <p>
                That means every later phase can focus on backend depth without
                needing a redesign pass to look polished in demos.
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Trust & controls",
                description:
                  "Server-controlled answer generation, evidence-only responses, and transparent uncertainty handling."
              },
              {
                title: "Financial structure",
                description:
                  "Section-aware handling for Risk Factors, MD&A, statements, notes, and investor communications."
              },
              {
                title: "Deployment path",
                description:
                  "Next.js frontend, FastAPI backend, Modal jobs, Supabase metadata, and Qdrant-ready retrieval."
              },
              {
                title: "Interview leverage",
                description:
                  "A project that demonstrates product taste, RAG rigor, data pipelines, and production engineering habits."
              }
            ].map((item) => (
              <Card key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </PageShell>
    </div>
  );
}
