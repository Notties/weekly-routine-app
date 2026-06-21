"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExtraFoodCard({
  extra,
  onAdd,
  onClear,
}: {
  extra?: { kcal: number; protein: number };
  onAdd: (kcal: number, protein: number) => void;
  onClear: () => void;
}) {
  const [kcal, setKcal] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const has = !!extra && (extra.kcal > 0 || extra.protein > 0);

  const add = () => {
    const k = parseFloat(kcal) || 0;
    const p = parseFloat(protein) || 0;
    if (k <= 0 && p <= 0) return;
    onAdd(k, p);
    setKcal("");
    setProtein("");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">อาหารนอกแผนวันนี้</h3>
        {has && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            ล้าง
          </button>
        )}
      </div>
      {has && (
        <p className="mt-1 text-xs text-muted-foreground tnum">
          เพิ่มแล้ววันนี้:{" "}
          <span className="font-semibold text-foreground">{extra!.kcal}</span> kcal ·
          โปรตีน{" "}
          <span className="font-semibold text-foreground">{extra!.protein}</span> ก.
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          placeholder="kcal"
          className="tnum w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          type="number"
          inputMode="numeric"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          placeholder="โปรตีน (ก.)"
          className="tnum w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <Button
          onClick={add}
          size="icon"
          className="size-9 shrink-0"
          aria-label="เพิ่มอาหารนอกแผน"
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}
