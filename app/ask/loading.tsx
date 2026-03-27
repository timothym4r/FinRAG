import { PageShell } from "@/components/page-shell";
import { PageLoading } from "@/components/page-loading";

export default function Loading() {
  return (
    <PageShell className="py-10">
      <PageLoading sections={3} />
    </PageShell>
  );
}

