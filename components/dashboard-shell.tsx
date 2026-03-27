import Link from "next/link";
import { Bell, ChevronDown, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { dashboardNav } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  pathname
}: {
  children: React.ReactNode;
  pathname: string;
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-4 md:p-6">
        <aside className="hidden w-[272px] shrink-0 rounded-[32px] border border-slate-200/70 bg-slate-950 px-5 py-6 text-white shadow-glow lg:flex lg:flex-col">
          <Logo href="/dashboard" />
          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Workspace
            </div>
            <div className="mt-2 text-lg font-semibold">Capital Research</div>
            <div className="mt-1 text-sm text-slate-400">
              SEC, investor relations, earnings transcripts
            </div>
            <Badge variant="success" className="mt-4 w-fit">
              Demo Mode
            </Badge>
          </div>
          <nav className="mt-8 space-y-1">
            {dashboardNav.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-2xl px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "bg-white text-slate-950"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="text-sm font-semibold">Retrieval quality</div>
            <div className="mt-2 text-sm text-slate-300">
              Dense retrieval, section-aware chunking, hybrid search, and reranking are staged into later phases.
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-[32px] border border-slate-200/70 bg-white/90 px-5 py-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 md:w-[360px]">
              <Search className="h-4 w-4" />
              Search companies, filings, chunks, or jobs
            </div>
            <div className="flex items-center gap-3 self-end md:self-auto">
              <Button variant="outline" size="icon" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <Avatar>
                  <AvatarFallback>AR</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <div className="text-sm font-semibold text-slate-900">
                    Analyst Reviewer
                  </div>
                  <div className="text-xs text-slate-500">founder@finrag.dev</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}

