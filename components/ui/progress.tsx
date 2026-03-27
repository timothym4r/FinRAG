"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

export function Progress({
  className,
  value
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80",
        className
      )}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 rounded-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

