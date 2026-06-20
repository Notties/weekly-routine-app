import * as React from "react";
import { cn } from "@/lib/utils";

/** หัวข้อส่วนเล็ก ๆ ตัวพิมพ์เน้น */
export function SectionTitle({
  children,
  icon,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      {icon}
      {children}
    </h3>
  );
}

/** รายการขั้นตอน 1-2-3 (มีเลขนำหน้า) */
export function StepList({ steps }: { steps: string[] }) {
  if (!steps.length) return null;
  return (
    <ol className="mt-2 space-y-1.5">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
          <span className="tnum mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-foreground">
            {i + 1}
          </span>
          <span className="leading-snug">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** รายการแบบจุด (วอร์มอัพ/คูลดาวน์/ทิป) */
export function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
          <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
          <span className="leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** แถวป้ายกำกับ */
export function TagRow({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={i}
          className="rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
