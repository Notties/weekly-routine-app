"use client";

import * as React from "react";
import { RotateCcw, CalendarRange, Repeat } from "lucide-react";
import { week } from "@/data";
import { SHOP_CATEGORIES, type ShopItem } from "@/data/types";
import {
  shoppingTotals,
  splitRecurring,
  itemKey,
  computeShoppingItems,
} from "@/lib/shopping";
import { getChecked, setChecked, clearChecked } from "@/lib/storage";
import { baht } from "@/lib/format";
import { ShopItemRow } from "@/components/shop-item-row";
import { Button } from "@/components/ui/button";

export function ShoppingView({ swaps }: { swaps: Record<string, string> }) {
  const [checked, setCheckedState] = React.useState<Record<string, boolean>>(
    {}
  );

  React.useEffect(() => {
    setCheckedState(getChecked());
  }, []);

  const toggle = (key: string, value: boolean) => {
    setChecked(key, value);
    setCheckedState((prev) => {
      const next = { ...prev };
      if (value) next[key] = true;
      else delete next[key];
      return next;
    });
  };

  const reset = () => {
    clearChecked();
    setCheckedState({});
  };

  // วัตถุดิบคำนวณจากเมนูที่ใช้จริงในสัปดาห์ (เปลี่ยนตามการสลับเมนู)
  const shopping = React.useMemo(
    () => computeShoppingItems(week, swaps),
    [swaps]
  );
  const totals = shoppingTotals(shopping);
  const { weekly, longLasting } = splitRecurring(shopping);
  const checkedCount = Object.keys(checked).length;

  return (
    <div className="space-y-5 px-4 py-4">
      {/* สรุปงบ */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary bg-primary p-3 text-primary-foreground">
            <p className="flex items-center gap-1.5 text-xs opacity-80">
              <CalendarRange className="size-3.5" />
              งบสัปดาห์ถัดไป
            </p>
            <p className="tnum mt-1 text-2xl font-bold">
              {baht(totals.weeklyTotal)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">เฉลี่ยต่อวัน</p>
            <p className="tnum mt-1 text-2xl font-bold">
              {baht(totals.perDay)}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-border px-3 py-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Repeat className="size-3.5" />
            ของใช้นาน (ซื้อครั้งเดียว)
          </span>
          <span className="tnum font-semibold">{baht(totals.oneTimeTotal)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="tnum">
            รวมรอบนี้ {baht(totals.grandTotal)} · ติ๊กแล้ว {checkedCount}/
            {shopping.length}
          </span>
          {checkedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-7 gap-1 px-2 text-xs"
            >
              <RotateCcw className="size-3" />
              ล้างติ๊ก
            </Button>
          )}
        </div>
      </div>

      {/* ของรายสัปดาห์ */}
      <ShopGroup
        title="ของรายสัปดาห์"
        subtitle="ซื้อทุกสัปดาห์"
        items={weekly}
        checked={checked}
        onToggle={toggle}
      />

      {/* ของใช้นาน */}
      <ShopGroup
        title="ของใช้นาน"
        subtitle="ซื้อครั้งเดียวใช้ได้หลายสัปดาห์"
        items={longLasting}
        checked={checked}
        onToggle={toggle}
      />
    </div>
  );
}

function ShopGroup({
  title,
  subtitle,
  items,
  checked,
  onToggle,
}: {
  title: string;
  subtitle: string;
  items: ShopItem[];
  checked: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
}) {
  const groupTotal = items.reduce((s, i) => s + i.price, 0);

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <span className="tnum text-sm font-semibold">{baht(groupTotal)}</span>
      </div>

      <div className="space-y-4">
        {SHOP_CATEGORIES.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          if (catItems.length === 0) return null;
          const catTotal = catItems.reduce((s, i) => s + i.price, 0);

          return (
            <div
              key={cat}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </span>
                <span className="tnum text-xs font-semibold">
                  {baht(catTotal)}
                </span>
              </div>
              <div className="divide-y divide-border px-3">
                {catItems.map((item) => {
                  const key = itemKey(item);
                  return (
                    <ShopItemRow
                      key={key}
                      item={item}
                      checked={!!checked[key]}
                      onToggle={(v) => onToggle(key, v)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
