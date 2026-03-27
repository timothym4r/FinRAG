import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="max-w-3xl font-serif text-3xl tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

