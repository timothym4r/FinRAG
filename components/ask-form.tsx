"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ApiRequestError,
  askQuestion,
  type ApiDocument,
  type ApiQAResponse
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ChatTurn = {
  id: string;
  query: string;
  response: ApiQAResponse;
};

const STREAMING_FRAME_MS = 14;

function createTurnId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AskForm({
  documents
}: {
  documents: ApiDocument[];
}) {
  const [query, setQuery] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const [streamingTurnId, setStreamingTurnId] = useState<string | null>(null);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedTurn =
    turns.find((turn) => turn.id === selectedTurnId) || turns[turns.length - 1] || null;

  useEffect(() => {
    if (!selectedTurn || selectedTurn.id !== streamingTurnId) {
      return;
    }

    const fullAnswer = selectedTurn.response.answer;
    if (streamedAnswer === fullAnswer) {
      setStreamingTurnId(null);
      return;
    }

    const timer = window.setInterval(() => {
      setStreamedAnswer((current) => {
        const nextLength = Math.min(fullAnswer.length, current.length + 6);
        const nextValue = fullAnswer.slice(0, nextLength);
        if (nextValue === fullAnswer) {
          window.clearInterval(timer);
          setStreamingTurnId(null);
        }
        return nextValue;
      });
    }, STREAMING_FRAME_MS);

    return () => window.clearInterval(timer);
  }, [selectedTurn, streamedAnswer, streamingTurnId]);

  useEffect(() => {
    if (!activeChunkId) {
      return;
    }

    const element = chunkRefs.current[activeChunkId];
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeChunkId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!query.trim()) {
      setError("Enter a question to query the indexed corpus.");
      return;
    }

    const normalizedQuery = query.trim();
    setIsSubmitting(true);
    setError(null);
    setLoadingStage("Embedding query and retrieving source chunks...");

    try {
      const response = await askQuestion({
        query: normalizedQuery,
        top_k: 5,
        document_id: selectedDocumentId || undefined
      });

      const turnId = createTurnId();
      const nextTurn = {
        id: turnId,
        query: normalizedQuery,
        response
      };

      setLoadingStage("Reranking evidence and composing grounded answer...");
      setTurns((current) => [...current, nextTurn]);
      setSelectedTurnId(turnId);
      setActiveChunkId(response.citations[0] || response.retrieved_chunks[0]?.chunk_id || null);
      setStreamingTurnId(turnId);
      setStreamedAnswer("");
      setQuery("");
    } catch (submissionError) {
      setError(
        submissionError instanceof ApiRequestError
          ? submissionError.message
          : "Unable to complete retrieval right now."
      );
    } finally {
      setIsSubmitting(false);
      setLoadingStage(null);
    }
  }

  function handleCitationClick(chunkId: string) {
    setActiveChunkId(chunkId);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.03fr_0.97fr]">
      <div className="space-y-6">
        <form onSubmit={onSubmit} className="rounded-[28px] border border-slate-200/80 bg-white p-5">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-900">
              Ask AI
              <textarea
                className="mt-2 min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm outline-none transition focus:border-emerald-500"
                placeholder="What changed in the company's risk factor language around customer concentration?"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
            <label className="block text-sm font-medium text-slate-900">
              Scope
              <select
                className="mt-2 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={selectedDocumentId}
                onChange={(event) => setSelectedDocumentId(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Ask the indexed corpus</option>
                {documents.map((document) => (
                  <option key={document.id} value={document.id}>
                    {document.company} · {document.filename}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Working
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Ask question
                </>
              )}
            </Button>
            <p className="text-sm text-slate-500">
              Answers are generated only from retrieved context and will decline when evidence is weak.
            </p>
          </div>
          {isSubmitting && loadingStage ? (
            <div className="mt-4 rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {loadingStage}
            </div>
          ) : null}
        </form>

        <div className="rounded-[28px] border border-slate-200/80 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Chat</div>
              <div className="mt-1 text-sm text-slate-500">
                Live retrieval answers with evidence and clickable citations
              </div>
            </div>
            <Badge variant="success">
              {selectedTurn ? `confidence ${selectedTurn.response.confidence.toFixed(2)}` : "ready"}
            </Badge>
          </div>

          <div className="mt-5 space-y-4">
            {turns.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500">
                Ask a question to start a grounded conversation over your indexed filings.
              </div>
            ) : (
              turns.map((turn) => {
                const isActive = turn.id === (selectedTurn?.id || "");
                const turnVisibleAnswer =
                  turn.id === streamingTurnId ? streamedAnswer : turn.response.answer;

                return (
                  <div
                    key={turn.id}
                    className={cn(
                      "rounded-[24px] border p-4 transition-colors",
                      isActive
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-200/80 bg-slate-50/60"
                    )}
                  >
                    <div className="rounded-[20px] bg-slate-950 px-4 py-3 text-sm text-white">
                      {turn.query}
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTurnId(turn.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTurnId(turn.id);
                        }
                      }}
                      className="mt-3 block w-full rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <Sparkles className="h-4 w-4 text-emerald-700" />
                          FinRAG
                        </div>
                        <div className="text-xs text-slate-400">
                          {turn.response.confidence.toFixed(2)} confidence
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {turnVisibleAnswer}
                        {turn.id === streamingTurnId ? (
                          <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-emerald-600 align-middle" />
                        ) : null}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {turn.response.citations.map((citation, index) => (
                          <button
                            key={citation}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedTurnId(turn.id);
                              handleCitationClick(citation);
                            }}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                              activeChunkId === citation && isActive
                                ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300"
                            )}
                          >
                            [{index + 1}] {citation}
                          </button>
                        ))}
                      </div>
                      <p className="mt-4 text-sm text-slate-500">{turn.response.explanation}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Sources</div>
            <div className="mt-1 text-sm text-slate-500">
              Retrieved chunk previews with citation-linked highlighting
            </div>
          </div>
          <Badge variant="secondary">
            {selectedTurn?.response.retrieved_chunks.length || 0} retrieved
          </Badge>
        </div>
        <div className="mt-5 space-y-4">
          {selectedTurn?.response.retrieved_chunks.length ? (
            selectedTurn.response.retrieved_chunks.map((chunk, index) => {
              const isHighlighted = activeChunkId === chunk.chunk_id;
              const isCited = selectedTurn.response.citations.includes(chunk.chunk_id);

              return (
                <div
                  key={chunk.chunk_id}
                  ref={(element) => {
                    chunkRefs.current[chunk.chunk_id] = element;
                  }}
                  className={cn(
                    "rounded-[24px] border p-4 transition-all",
                    isHighlighted
                      ? "border-emerald-400 bg-emerald-50 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
                      : "border-slate-200/80"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        [{index + 1}] {chunk.section}
                      </div>
                      <div className="text-xs text-slate-500">
                        {chunk.company} · {chunk.filing_type} · {chunk.filing_date} · page {chunk.page}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isCited ? <Badge variant="success">cited</Badge> : null}
                      <Badge variant="secondary">vector {chunk.score.toFixed(2)}</Badge>
                      <Badge variant="outline">rerank {chunk.rerank_score.toFixed(2)}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{chunk.content}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Chunk ID {chunk.chunk_id}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCitationClick(chunk.chunk_id)}
                      className="text-xs font-medium text-emerald-700 transition hover:text-emerald-900"
                    >
                      Highlight source
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center text-sm text-slate-500">
              Source chunks will appear here after a query runs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
