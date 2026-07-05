"use client";

import * as React from "react";
import { Snowflake, AlertCircle, Lightbulb, Check, Repeat } from "lucide-react";
import { week } from "@/data";
import {
  prepDayChecklist,
  dailyKitchenFlow,
  weighItems,
  countItems,
  safetyRules,
} from "@/data/prep-guide";
import { STORAGE_ZONE_LABEL, type StorageZone } from "@/data/types";
import {
  meatBags,
  weeklyIngredientGrams,
  groupByStorageZone,
} from "@/lib/prep";
import { SectionTitle, StepList, BulletList } from "@/components/blocks";

/** สีจุดประจำโซนเก็บ */
const ZONE_DOT: Record<StorageZone, string> = {
  fridge: "bg-primary",
  freezer: "bg-sky-500",
  pantry: "bg-amber-500",
};

const ZONE_ORDER: StorageZone[] = ["fridge", "freezer", "pantry"];

/**
 * โหมด "แบ่งเก็บ" ของแท็บซื้อของ — คู่มือหลังซื้อสำหรับมือใหม่
 * ตัวเลขถุงเนื้อ/กรัมรวมคำนวณจากเมนูที่ใช้จริง (อัปเดตตามการสลับเมนู)
 */
export function PrepView({ swaps }: { swaps: Record<string, string> }) {
  const bags = React.useMemo(() => meatBags(week, swaps), [swaps]);
  const totals = React.useMemo(
    () => weeklyIngredientGrams(week, swaps),
    [swaps]
  );
  const zones = React.useMemo(
    () => groupByStorageZone(totals.map((t) => t.name)),
    [totals]
  );
  const meatTotal = bags.reduce((s, b) => s + b.total, 0);

  return (
    <div className="space-y-5 px-4 py-4">
      {/* ถุงเนื้อรายวัน */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionTitle icon={<Snowflake className="size-4" />}>
          แบ่งเนื้อเป็นถุงรายวัน (ชั่งครั้งเดียวจบ)
        </SectionTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          วันซื้อของ ชั่งเนื้อใส่ถุงซิปตามกรัมของแต่ละวัน เขียนชื่อวันติดไว้ —
          ทั้งสัปดาห์ไม่ต้องชั่งเนื้ออีกเลย เพราะ 1 ถุง = เนื้อของ 1 วันพอดี
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {bags.map((bag) => (
            <div
              key={bag.day}
              className="rounded-xl border border-dashed border-border bg-muted/40 p-2 text-center"
            >
              <p className="text-xs font-semibold">{bag.label}</p>
              {bag.total > 0 ? (
                <>
                  <p className="tnum text-base font-bold text-primary">
                    {bag.total}
                  </p>
                  <p className="text-[10px] text-muted-foreground">กรัม</p>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground">—</p>
              )}
            </div>
          ))}
        </div>
        {/* ชนิดเนื้อในถุง (แสดงเมื่อสัปดาห์นี้มีเนื้อมากกว่า 1 ชนิด) */}
        {new Set(bags.flatMap((b) => b.items.map((i) => i.name))).size > 1 && (
          <div className="mt-2 space-y-1">
            {bags
              .filter((b) => b.items.length > 0)
              .map((b) => (
                <p
                  key={b.day}
                  className="tnum text-xs text-muted-foreground"
                >
                  {b.label}:{" "}
                  {b.items.map((i) => `${i.name} ${i.grams} ก.`).join(" + ")}
                </p>
              ))}
          </div>
        )}
        <p className="tnum mt-3 rounded-lg bg-muted px-2.5 py-2 text-xs text-foreground">
          รวมทั้งสัปดาห์ {meatTotal.toLocaleString()} ก. · ถุงพรุ่งนี้ไว้ช่องเย็นธรรมดา
          ที่เหลือช่องแข็ง · ทุกคืนย้ายถุงถัดไปลงมาละลาย
        </p>
      </section>

      {/* ใช้จริงต่อสัปดาห์ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionTitle icon={<Repeat className="size-4" />}>
          ใช้จริงสัปดาห์นี้ (กรัม)
        </SectionTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          รวมจากทุกมื้อทั้ง 7 วันตามเมนูที่เลือกไว้ — สลับเมนูเมื่อไหร่เลขอัปเดตเอง
        </p>
        <div className="mt-3 divide-y divide-border">
          {totals
            .filter((t) => t.grams > 0)
            .map((t) => (
              <div
                key={t.name}
                className="flex items-baseline justify-between gap-2 py-2"
              >
                <span className="text-sm font-medium">{t.name}</span>
                <span className="tnum text-sm font-semibold text-muted-foreground">
                  {t.grams.toLocaleString()} ก.
                </span>
              </div>
            ))}
        </div>
      </section>

      {/* เก็บที่ไหน */}
      <section>
        <div className="mb-2">
          <h2 className="text-base font-bold">เก็บชิ้นไหนไว้ตรงไหน</h2>
          <p className="text-xs text-muted-foreground">
            เฉพาะของที่สัปดาห์นี้ใช้จริง
          </p>
        </div>
        <div className="space-y-4">
          {ZONE_ORDER.map((zone) => {
            const items = zones[zone];
            if (items.length === 0) return null;
            const { label, temp } = STORAGE_ZONE_LABEL[zone];
            return (
              <div
                key={zone}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <span
                      className={`size-2 rounded-full ${ZONE_DOT[zone]}`}
                    />
                    {label}
                  </span>
                  <span className="tnum text-xs font-semibold text-muted-foreground">
                    {temp}
                  </span>
                </div>
                <div className="divide-y divide-border px-3">
                  {items.map((item) => (
                    <div key={item.name} className="py-2.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {item.name}
                        </span>
                        <span className="tnum shrink-0 text-xs text-muted-foreground">
                          {item.storage.life}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {item.storage.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* เช็คลิสต์วันซื้อของ */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionTitle icon={<Check className="size-4" />}>
          เช็คลิสต์วันซื้อของ (~30 นาที)
        </SectionTitle>
        <StepList steps={prepDayChecklist} />
      </section>

      {/* กิจวัตรประจำวัน */}
      <section className="rounded-2xl border border-border bg-card p-4">
        <SectionTitle icon={<Lightbulb className="size-4" />}>
          กิจวัตรครัวประจำวัน
        </SectionTitle>
        <StepList steps={dailyKitchenFlow} />
      </section>

      {/* ชั่ง vs นับ */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <SectionTitle>ต้องชั่ง (กด tare ก่อน)</SectionTitle>
          <BulletList items={weighItems} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <SectionTitle>นับเอาได้ ไม่ต้องชั่ง</SectionTitle>
          <BulletList items={countItems} />
        </div>
      </section>

      {/* กฎความปลอดภัย */}
      <section className="rounded-2xl border border-destructive/30 bg-card p-4">
        <SectionTitle
          icon={<AlertCircle className="size-4 text-destructive" />}
          className="text-destructive"
        >
          กฎความปลอดภัย ท่องให้ขึ้นใจ
        </SectionTitle>
        <StepList steps={safetyRules} />
      </section>
    </div>
  );
}
