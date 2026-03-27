import type { Route } from "next";
import Link from "next/link";

export function Logo({ href = "/" }: { href?: Route }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg shadow-slate-900/20">
        FR
      </div>
      <div>
        <div className="text-sm font-semibold tracking-[0.18em] text-slate-500">
          FINRAG
        </div>
        <div className="-mt-0.5 text-sm text-slate-700">
          Financial Retrieval OS
        </div>
      </div>
    </Link>
  );
}
