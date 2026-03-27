import { AlertCircle, FolderOpen } from "lucide-react";

import { DocumentUploadForm } from "@/components/document-upload-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiDocument, ApiRequestError, getDocuments } from "@/lib/api";

export default async function DocumentsPage() {
  let documents: ApiDocument[] = [];
  let errorMessage: string | null = null;

  try {
    documents = await getDocuments();
  } catch (error) {
    errorMessage =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load documents from the backend.";
  }

  return (
    <DashboardShell pathname="/documents">
      <PageShell className="space-y-6">
        <section className="grid gap-6 rounded-[32px] border border-slate-200/70 bg-white/90 p-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div>
            <h1 className="font-serif text-3xl text-slate-950">Document library</h1>
            <p className="mt-2 text-sm text-slate-500">
              Upload real filings and investor documents to the FastAPI backend and browse their persisted metadata here.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Badge variant="outline">Backend-powered</Badge>
              <Badge variant="outline">Local storage</Badge>
              <Badge variant="outline">Status tracked</Badge>
            </div>
          </div>
          <DocumentUploadForm />
        </section>

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Every row below comes from the live backend database.</CardDescription>
            </div>
            <Badge variant="secondary">{documents.length} total</Badge>
          </CardHeader>
          <CardContent className="grid gap-4">
            {errorMessage ? (
              <div className="flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Backend unavailable</div>
                  <div className="mt-1">{errorMessage}</div>
                </div>
              </div>
            ) : null}
            {!errorMessage && documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                <FolderOpen className="h-10 w-10 text-slate-400" />
                <div className="mt-4 text-lg font-semibold text-slate-900">
                  No documents uploaded yet
                </div>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                  Upload a filing above and it will appear here immediately with its real backend status.
                </p>
              </div>
            ) : null}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-4 rounded-[24px] border border-slate-200/80 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="text-base font-semibold text-slate-900">{doc.filename}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {doc.company} · {doc.filing_type} · filed {doc.filing_date}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">Stored locally</Badge>
                    <Badge variant="success" className="capitalize">
                      {doc.status}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 text-sm text-slate-500 md:grid-cols-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</div>
                    <div className="mt-1 font-semibold capitalize text-slate-900">{doc.status}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Chunks</div>
                    <div className="mt-1 font-semibold text-slate-900">{doc.chunk_count}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Created</div>
                    <div className="mt-1 font-semibold text-slate-900">
                      {new Date(doc.created_at).toLocaleDateString("en-US")}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </PageShell>
    </DashboardShell>
  );
}
