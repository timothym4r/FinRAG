"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-12 text-center">
      <div className="max-w-xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">
          Interface error
        </div>
        <h2 className="mt-4 font-serif text-3xl text-slate-950">
          The FinRAG workspace hit an unexpected problem.
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The UI failed safely. You can retry the route without losing backend data.
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Retry</Button>
        </div>
      </div>
    </div>
  );
}

