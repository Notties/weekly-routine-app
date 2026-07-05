"use client";

import * as React from "react";
import {
  RotateCcw,
  CalendarRange,
  Repeat,
  Wallet,
  Droplet,
  ShoppingCart,
  CookingPot,
} from "lucide-react";
import { week, water } from "@/data";
import { SHOP_CATEGORIES, type ShopItem } from "@/data/types";
import {
  shoppingTotals,
  splitRecurring,
  itemKey,
  computeShoppingItems,
} from "@/lib/shopping";
import { monthlyCost, bottlesPerDay } from "@/lib/cost";
import { useAppStore } from "@/lib/store";
import { baht } from "@/lib/format";
import { ShopItemRow } from "@/components/shop-item-row";
import { PrepView } from "@/components/views/prep-view";
import { Button } from "@/components/ui/button";

/** โหมดของแท็บซื้อของ: รายการซื้อ / แบ่งเก็บ (คู่มือหลังซื้อ) */
type ShoppingMode = "list" | "prep";

export function ShoppingView({ swaps }: { swaps: Record<string, string> }) {
  const checked = useAppStore((s) => s.checked);
  const toggleChecked = useAppStore((s) => s.toggleChecked);
  const clearChecked = useAppStore((s) => s.clearChecked);
  const [mode, setMode] = React.useState<ShoppingMode>("list");

  const toggle = (key: string, _value: boolean) => toggleChecked(key);
  const reset = () => clearChecked();

  // วัตถุดิบคำนวณจากเมนูที่ใช้จริงในสัปดาห์ (เปลี่ยนตามการสลับเมนู)
  const shopping = React.useMemo(
    () => computeShoppingItems(week, swaps),
    [swaps]
  );
  const totals = shoppingTotals(shopping);
  const { weekly, longLasting } = splitRecurring(shopping);
  const checkedCount = Object.keys(checked).length;

  // ค่าใช้จ่ายรายเดือน (ค่ากิน + ค่าน้ำดื่ม)
  const cost = monthlyCost(shopping, water);
  const bpd = bottlesPerDay(water.litersPerDay, water.pack.literEach);

  // แถบสลับโหมด (แสดงทั้งสองโหมด)
  const modeSwitch = (
    <div className="mx-4 mt-4 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1">
      {(
        [
          { value: "list", label: "รายการซื้อ", Icon: ShoppingCart },
          { value: "prep", label: "แบ่งเก็บ", Icon: CookingPot },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setMode(value)}
          aria-pressed={mode === value}
          className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === value
              ? "bg-background font-semibold text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );

  if (mode === "prep") {
    return (
      <div>
        {modeSwitch}
        <PrepView swaps={swaps} />
      </div>
    );
  }

  return (
    <div>
      {modeSwitch}
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

      {/* ค่าใช้จ่ายรายเดือน */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-bold">
          <Wallet className="size-4" />
          ค่าใช้จ่ายรายเดือน (ประมาณ)
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">ค่ากิน</p>
            <p className="tnum mt-1 text-xl font-bold">
              {baht(cost.foodPerMonth)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Droplet className="size-3" />
              ค่าน้ำดื่ม
            </p>
            <p className="tnum mt-1 text-xl font-bold">
              {baht(cost.waterPerMonth)}
            </p>
            <p className="tnum mt-0.5 text-[11px] text-muted-foreground">
              {cost.waterPacksPerMonth} แพ็ก ({cost.waterBottlesPerMonth} ขวด)
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-primary bg-primary px-3 py-2.5 text-primary-foreground">
          <span className="text-sm font-medium">รวมต่อเดือน</span>
          <span className="tnum text-xl font-bold">
            {baht(cost.totalPerMonth)}
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground tnum">
          ≈ {baht(cost.perDay)}/วัน · ของสด {baht(cost.freshPerMonth)} +
          ของใช้นาน {baht(cost.stockPerMonth)} (ตุน ~เดือนละครั้ง บางอย่างอยู่ได้
          นานกว่า เดือนถัดไปถูกลง)
        </p>
        <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-2 text-xs text-foreground">
          <Droplet className="size-3.5 shrink-0" />
          <span className="tnum">
            ควรดื่มน้ำ ~{water.litersPerDay} ลิตร/วัน ≈ {bpd} ขวด (ขวด 1.5L) ·
            เดือนละ ~{cost.waterBottlesPerMonth} ขวด
          </span>
        </p>
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
