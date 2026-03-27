"use client";

import type { FormEvent } from "react";
import { startTransition, useId, useMemo, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api";

type FilingType = "10-K" | "10-Q" | "Earnings";

type UploadState = {
  company: string;
  filingType: FilingType;
  filingDate: string;
  file: File | null;
};

const initialState: UploadState = {
  company: "",
  filingType: "10-K",
  filingDate: "",
  file: null
};

export function DocumentUploadForm() {
  const companyId = useId();
  const filingTypeId = useId();
  const filingDateId = useId();
  const fileId = useId();
  const router = useRouter();
  const [form, setForm] = useState<UploadState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isReady = useMemo(() => {
    return Boolean(form.company.trim() && form.filingDate && form.file);
  }, [form]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReady || !form.file) {
      setError("Select a file and complete the company and filing date fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    const payload = new FormData();
    payload.append("file", form.file);
    payload.append("company", form.company.trim());
    payload.append("filing_type", form.filingType);
    payload.append("filing_date", form.filingDate);

    try {
      const response = await new Promise<XMLHttpRequest>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${getApiBaseUrl()}/documents/upload`);

        xhr.upload.addEventListener("progress", (progressEvent) => {
          if (progressEvent.lengthComputable) {
            setProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr);
            return;
          }

          try {
            const parsed = JSON.parse(xhr.responseText) as { message?: string };
            reject(new Error(parsed.message || "Upload failed."));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}.`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Unable to reach the backend API."));
        });

        xhr.send(payload);
      });

      const uploadedDocument = JSON.parse(response.responseText) as {
        filename: string;
        status: string;
      };

      setProgress(100);
      setSuccess(`${uploadedDocument.filename} uploaded successfully with status ${uploadedDocument.status}.`);
      setForm(initialState);
      startTransition(() => {
        router.refresh();
      });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed unexpectedly.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      id="document-upload-form"
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-600" htmlFor={companyId}>
          <span className="font-medium text-slate-900">Company</span>
          <input
            id={companyId}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500"
            placeholder="NVIDIA"
            value={form.company}
            onChange={(event) =>
              setForm((current) => ({ ...current, company: event.target.value }))
            }
            disabled={isSubmitting}
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600" htmlFor={filingTypeId}>
          <span className="font-medium text-slate-900">Filing type</span>
          <select
            id={filingTypeId}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500"
            value={form.filingType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                filingType: event.target.value as FilingType
              }))
            }
            disabled={isSubmitting}
          >
            <option value="10-K">10-K</option>
            <option value="10-Q">10-Q</option>
            <option value="Earnings">Earnings</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-slate-600" htmlFor={filingDateId}>
          <span className="font-medium text-slate-900">Filing date</span>
          <input
            id={filingDateId}
            type="date"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500"
            value={form.filingDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, filingDate: event.target.value }))
            }
            disabled={isSubmitting}
          />
        </label>
        <label className="space-y-2 text-sm text-slate-600" htmlFor={fileId}>
          <span className="font-medium text-slate-900">Document file</span>
          <input
            id={fileId}
            type="file"
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white"
            onChange={(event) =>
              setForm((current) => ({ ...current, file: event.target.files?.[0] || null }))
            }
            disabled={isSubmitting}
          />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
          <span>Upload progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!isReady || isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload document
            </>
          )}
        </Button>
        <p className="self-center text-sm text-slate-500">
          Files are stored through the live FastAPI backend and persisted locally.
        </p>
      </div>
    </form>
  );
}
