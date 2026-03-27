import { AlertCircle } from "lucide-react";

import { AskForm } from "@/components/ask-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiDocument, ApiRequestError, getDocuments } from "@/lib/api";

export default async function AskPage() {
  let documents: ApiDocument[] = [];
  let errorMessage: string | null = null;

  try {
    documents = await getDocuments();
  } catch (error) {
    errorMessage =
      error instanceof ApiRequestError
        ? error.message
        : "Unable to load indexed documents from the backend.";
  }

  return (
    <DashboardShell pathname="/ask">
      <PageShell className="space-y-6">
        <Card className="bg-white/90">
          <CardHeader>
            <Badge className="w-fit">Grounded retrieval QA</Badge>
            <CardTitle className="pt-4 font-serif text-3xl">
              Ask the indexed financial corpus
            </CardTitle>
            <CardDescription>
              Query embeddings retrieve candidate chunks from Qdrant, results are reranked, and the answer is composed only from retrieved evidence.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMessage ? (
              <div className="mb-6 flex items-start gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-semibold">Backend unavailable</div>
                  <div className="mt-1">{errorMessage}</div>
                </div>
              </div>
            ) : null}
            <AskForm documents={documents.filter((document) => document.status === "indexed")} />
          </CardContent>
        </Card>
      </PageShell>
    </DashboardShell>
  );
}
