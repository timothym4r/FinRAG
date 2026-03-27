import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("container py-8 md:py-10", className)}>{children}</div>;
}

