/**
 * Skeleton screen ระหว่างโหลด state จาก backend — วาดโครงตามเลย์เอาต์จริง
 * (หัวแอป → แถบวัน → แท็บ → การ์ดเนื้อหา) ให้เลย์เอาต์ไม่กระโดดตอนโหลดเสร็จ
 */
export function AppSkeleton() {
  return (
    <div
      className="flex min-h-full flex-col"
      role="status"
      aria-busy="true"
      aria-label="กำลังโหลดข้อมูล"
    >
      <div className="border-b border-border">
        {/* หัวแอป: โลโก้ + ชื่อ (ของจริง) · อวตาร (โครง) */}
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 animate-pulse place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground motion-reduce:animate-none">
              K
            </span>
            <span className="text-sm font-bold">Knot</span>
          </div>
          <div className="size-8 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        </div>

        {/* แถบเลือกวัน 7 ช่อง */}
        <div className="mx-auto flex w-full max-w-2xl gap-1.5 px-4 pb-2.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-12 flex-1 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>

        {/* แถบแท็บ 6 ช่อง */}
        <div className="mx-auto grid w-full max-w-2xl grid-cols-6 gap-3 px-4 pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="size-4 animate-pulse rounded bg-muted motion-reduce:animate-none"
                style={{ animationDelay: `${i * 90}ms` }}
              />
              <div
                className="h-2 w-8 animate-pulse rounded bg-muted motion-reduce:animate-none"
                style={{ animationDelay: `${i * 90}ms` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* เนื้อหา: การ์ดโครง 3 ใบ */}
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-4 py-4 pb-safe">
        <CardSkeleton lines={2} />
        <CardSkeleton lines={4} delay={150} />
        <CardSkeleton lines={3} delay={300} />
      </div>

      <span className="sr-only">กำลังโหลดข้อมูลของคุณ…</span>
    </div>
  );
}

/** การ์ดโครง: หัวเรื่อง + บรรทัดเนื้อหาความยาวลดหลั่น */
function CardSkeleton({ lines, delay = 0 }: { lines: number; delay?: number }) {
  const widths = ["w-full", "w-5/6", "w-2/3", "w-1/2"];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div
        className="h-4 w-1/3 animate-pulse rounded bg-muted motion-reduce:animate-none"
        style={{ animationDelay: `${delay}ms` }}
      />
      <div className="mt-3 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 animate-pulse rounded bg-muted motion-reduce:animate-none ${widths[i % widths.length]}`}
            style={{ animationDelay: `${delay + (i + 1) * 90}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
