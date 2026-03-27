import { getPublicEnv } from "@/lib/env";

export type FilingType = "10-K" | "10-Q" | "Earnings";
export type DocumentStatus = "uploaded" | "processing" | "chunked" | "indexed" | "failed";

export type ApiDocument = {
  id: string;
  filename: string;
  company: string;
  filing_type: FilingType;
  filing_date: string;
  status: DocumentStatus;
  created_at: string;
  chunk_count: number;
};

export type HealthResponse = {
  status: string;
  environment: string;
  version: string;
  database: string;
  upload_dir: string;
};

export type ApiRetrievedChunk = {
  chunk_id: string;
  document_id: string;
  section: string;
  page: number;
  chunk_index: number;
  score: number;
  rerank_score: number;
  company: string;
  filing_type: string;
  filing_date: string;
  filename: string;
  content: string;
};

export type ApiQAResponse = {
  answer: string;
  citations: string[];
  retrieved_chunks: ApiRetrievedChunk[];
  confidence: number;
  explanation: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export function getApiBaseUrl() {
  const env = getPublicEnv();
  const baseUrl =
    typeof window === "undefined" ? env.API_BASE_URL : env.NEXT_PUBLIC_API_URL;
  return baseUrl.replace(/\/$/, "");
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { cache: "no-store" });

  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) {
        message = payload.message;
      }
    } catch {
      // Keep the default message when the response is not JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function getBackendHealth(): Promise<HealthResponse | null> {
  try {
    return await fetchApi<HealthResponse>("/health");
  } catch {
    return null;
  }
}

export async function getDocuments(): Promise<ApiDocument[]> {
  const payload = await fetchApi<{ items: ApiDocument[] }>("/documents");
  return payload.items;
}

export async function askQuestion(payload: {
  query: string;
  top_k?: number;
  document_id?: string;
  company?: string;
}): Promise<ApiQAResponse> {
  const response = await fetch(`${getApiBaseUrl()}/qa/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = `Backend request failed with status ${response.status}`;
    try {
      const parsed = (await response.json()) as { message?: string };
      if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // Keep default message.
    }
    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as ApiQAResponse;
}
