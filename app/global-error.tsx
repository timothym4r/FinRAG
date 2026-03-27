"use client";

import { useEffect } from "react";

export default function GlobalError({
  error
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#f5f7fb] text-slate-950">
        <div className="container flex min-h-screen items-center justify-center py-12">
          <div className="max-w-xl rounded-[32px] border border-rose-200 bg-white p-8 text-center shadow-sm">
            <div className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">
              Application error
            </div>
            <h1 className="mt-4 font-serif text-4xl">FinRAG could not render this screen.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Refresh the page or restart the local services. The backend data and uploaded documents remain intact.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

