# Tier 4B Workout Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มฟอร์มท่า (cue ต่อท่า กางดูในการ์ด) + คู่มือ progression (การ์ดแนะนำในแท็บออกกำลัง)

**Architecture:** cue/progression เป็นข้อมูลใน `src/data/workout-guide.ts` (cue เป็น map keyed ด้วยชื่อท่า — ไม่แตะ type `Exercise`/week.ts) · ExerciseCard ดึง cue ตามชื่อแสดงใน `<details>` · workout-view เพิ่มการ์ด progression (วันเล่นเวต)

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, Tailwind v4, lucide-react, `bun test`

## Global Constraints

- cue เก็บใน map `Record<ชื่อท่า, string[]>` (ชื่อตรงกับ `week.ts` เป๊ะ); ไม่แตะ type `Exercise` หรือ `week.ts`
- cue บังคับครบ **เฉพาะ 15 ท่าในวันเล่นเวต**; ใช้ `<details>` (native ไม่ต้องเป็น client component)
- progression เป็นการ์ดแนะนำ ไม่ผูก logging, ไม่ทำ mesocycle; แสดงเฉพาะ `day.type === "weights"`
- ภาษาไทยมือใหม่เข้าใจ, การ์ด/สไตล์เดิม (`rounded-xl/2xl border border-border`, `SectionTitle`/`BulletList`)
- Test: `bun test src/lib` · Type-check: `bun run build`

---

## File Structure

| ไฟล์ | ความรับผิดชอบ |
|---|---|
| `src/data/workout-guide.ts` (ใหม่) | `exerciseCues` (15 ท่า) + `progressionTips` |
| `src/data/index.ts` | export `exerciseCues`, `progressionTips` |
| `src/lib/workout-guide.test.ts` (ใหม่) | เทสต์ referential + เนื้อหา |
| `src/components/exercise-card.tsx` | + `<details>` ดูฟอร์ม |
| `src/components/views/workout-view.tsx` | + การ์ด progression |

---

## Task 1: ข้อมูล cue + progression + เทสต์ (TDD)

**Files:**
- Create: `src/data/workout-guide.ts`
- Modify: `src/data/index.ts`
- Test: `src/lib/workout-guide.test.ts`

**Interfaces:**
- Produces: `exerciseCues: Record<string, string[]>` (keys = ชื่อท่าวันเล่นเวต 15 ตัว), `progressionTips: string[]`

- [ ] **Step 1: เขียนเทสต์ `src/lib/workout-guide.test.ts`**

```ts
import { describe, it, expect } from "bun:test";
import { week } from "@/data/week";
import { exerciseCues, progressionTips } from "@/data/workout-guide";

describe("exerciseCues — referential", () => {
  const weightsExercises = week
    .filter((d) => d.type === "weights")
    .flatMap((d) => d.workout?.exercises ?? []);

  it("มีท่าวันเล่นเวตมากกว่า 10 ท่า", () => {
    expect(weightsExercises.length).toBeGreaterThan(10);
  });

  it("ทุกท่าในวันเล่นเวตมี cue", () => {
    const missing = [
      ...new Set(
        weightsExercises.map((e) => e.name).filter((n) => !exerciseCues[n])
      ),
    ];
    expect(missing).toEqual([]);
  });

  it("cue ทุกชุดมีอย่างน้อย 3 ข้อ", () => {
    const tooShort = Object.entries(exerciseCues)
      .filter(([, c]) => c.length < 3)
      .map(([n]) => n);
    expect(tooShort).toEqual([]);
  });
});

describe("progressionTips", () => {
  it("มีอย่างน้อย 3 ข้อ", () => {
    expect(progressionTips.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: รันเทสต์ ให้ fail**

Run: `bun test src/lib/workout-guide.test.ts`
Expected: FAIL (`Cannot find module '@/data/workout-guide'`)

- [ ] **Step 3: สร้าง `src/data/workout-guide.ts`**

```ts
// คู่มือออกกำลัง: cue ฟอร์มแต่ละท่า (keyed ด้วยชื่อท่าตรงกับ week.ts) + หลัก progression
// เพิ่มท่าใหม่ใน week.ts (วันเล่นเวต) ต้องเพิ่ม cue ที่นี่ด้วย (เทสต์ referential เช็คให้)

export const exerciseCues: Record<string, string[]> = {
  "Barbell Squat": [
    "วางบาร์บนกล้ามหลังบ่า (ไม่ใช่กระดูกคอ) เท้ากว้างเท่าหัวไหล่ ปลายเท้าเปิดออกเล็กน้อย",
    "ดันสะโพกไปข้างหลังเหมือนนั่งเก้าอี้ เข่าเปิดไปทางปลายเท้า หลังตรงตลอด",
    "ลงจนต้นขาขนานพื้น แล้วดันส้นเท้าขึ้นยืน",
    "ข้อผิดที่พบบ่อย: เข่าหุบเข้า/ส้นเท้าลอย — คุมเข่าให้บาน กดส้นเท้าติดพื้น",
  ],
  "Bench Press": [
    "นอนราบ ตาอยู่ใต้บาร์ จับกว้างกว่าหัวไหล่เล็กน้อย เก็บสะบักเข้าหากัน",
    "ลดบาร์ลงช้า ๆ มาที่กลางอก ศอกทำมุม ~45° กับลำตัว (ไม่กางสุด)",
    "ดันขึ้นจนแขนตึง บาร์เคลื่อนเฉียงเล็กน้อยมาเหนืออก",
    "เล่นหนักให้มีคนสปอตหรือใช้เซฟตี้บาร์เสมอ",
  ],
  "Bent-over Row": [
    "ก้มลำตัว ~45° หลังตรง เข่างอเล็กน้อย จับบาร์กว้างเท่าหัวไหล่",
    "ดึงบาร์เข้าหาสะดือ/ชายโครงล่าง บีบสะบักเข้าหากัน",
    "ลดลงช้า ๆ จนแขนตึง คุมจังหวะตลอด",
    "ข้อผิดที่พบบ่อย: หลังค่อม/ใช้แรงเหวี่ยง — ล็อกหลังตรง อย่าโยกตัว",
  ],
  "Overhead Press": [
    "ยืนเท้ากว้างเท่าสะโพก จับบาร์ระดับไหล่ ศอกอยู่ใต้ข้อมือ เกร็งหน้าท้อง/ก้น",
    "ดันบาร์ขึ้นตรง ๆ เหนือหัว ขยับหน้านิดให้บาร์ผ่านคาง",
    "ล็อกแขนเหนือหัว หัวลอดใต้บาร์ แล้วลดลงช้า ๆ",
    "ข้อผิดที่พบบ่อย: แอ่นหลังมาก — เกร็งแกนกลาง อย่าดันด้วยการแอ่นเอว",
  ],
  "Plank": [
    "วางศอกใต้หัวไหล่ ปลายเท้ายันพื้น ลำตัวเป็นเส้นตรงหัวจรดส้นเท้า",
    "เกร็งหน้าท้องและก้น ดึงสะดือเข้า อย่าให้สะโพกตกหรือยกสูง",
    "หายใจปกติ ค้างตามเวลาที่กำหนด",
  ],
  "Deadlift": [
    "เท้ากว้างเท่าสะโพก บาร์อยู่กลางเท้า ก้มจับบาร์กว้างกว่าเข่าเล็กน้อย",
    "อกตั้ง หลังตรง ไหล่อยู่เหนือบาร์เล็กน้อย เกร็งแกนกลาง",
    "ดันพื้นด้วยขา ลากบาร์ชิดหน้าแข้งขึ้น จบที่ยืนตรงบีบก้น (ไม่แอ่นหลัง)",
    "ข้อผิดที่พบบ่อย: หลังงอ/บาร์ห่างตัว — ล็อกหลังตรง เก็บบาร์ชิดลำตัว",
  ],
  "Incline Dumbbell Press": [
    "ตั้งเบาะเอียง ~30° นั่งพิงหลัง เริ่มดันดัมเบลขึ้นเหนืออกบน",
    "ลดลงช้า ๆ จนตึงอกบน ศอกทำมุม ~45° กับลำตัว",
    "ดันขึ้นจนแขนเกือบตึง คุมไม่ให้ดัมเบลกระแทกกัน",
  ],
  "Lat Pulldown / Pull-up": [
    "จับบาร์กว้างกว่าหัวไหล่ อกตั้ง เอนหลังเล็กน้อย",
    "ดึงบาร์ลงมาที่อกบน โดยเริ่มจากกดสะบัก/หุบศอกลง",
    "บีบปีกค้างแป๊บ แล้วปล่อยขึ้นช้า ๆ จนแขนตึง",
    "ข้อผิดที่พบบ่อย: เหวี่ยงตัว — คุมจังหวะ ใช้กล้ามหลังดึง ไม่ใช่แรงเหวี่ยง",
  ],
  "Walking Lunge": [
    "ก้าวไปข้างหน้า 1 ก้าวยาว ลดเข่าหลังลงเกือบแตะพื้น ลำตัวตั้งตรง",
    "เข่าหน้าตั้งฉาก ไม่เลยปลายเท้ามาก ดันส้นเท้าหน้าขึ้นก้าวต่อ",
    "สลับขาเดินไปข้างหน้า คุมสมดุล",
    "ข้อผิดที่พบบ่อย: เข่าหน้าบิดเข้า — คุมเข่าให้ตรงกับปลายเท้า",
  ],
  "Hanging Knee Raise": [
    "ห้อยตัวจากบาร์ แขนตึง เกร็งไหล่เล็กน้อย (อย่าปล่อยห้อยหลวม)",
    "ยกเข่าขึ้นหาอกโดยม้วนเชิงกราน เกร็งหน้าท้องล่าง",
    "ลดลงช้า ๆ คุมไม่ให้ตัวแกว่ง",
  ],
  "Romanian Deadlift": [
    "ยืนถือบาร์/ดัมเบล งอเข่านิดเดียวค้างไว้ (ไม่ย่อเพิ่ม)",
    "ดันสะโพกไปข้างหลัง ลดบาร์ชิดขาลงจนตึงต้นขาหลัง หลังตรง",
    "บีบก้นดันสะโพกกลับมายืนตรง",
    "ข้อผิดที่พบบ่อย: หลังงอ/ย่อเข่าเหมือนสควอต — เน้นพับสะโพก หลังตรง",
  ],
  "Dumbbell Shoulder Press": [
    "นั่งหลังตรง ถือดัมเบลระดับไหล่ ฝ่ามือหันไปข้างหน้า เกร็งแกนกลาง",
    "ดันขึ้นเหนือหัวจนแขนเกือบตึง ไม่ล็อกศอกกระแทก",
    "ลดลงช้า ๆ จนข้อศอกต่ำกว่าระดับไหล่เล็กน้อย",
  ],
  "Seated Cable Row": [
    "นั่งหลังตรง เข่างอเล็กน้อย จับด้ามดึง อกตั้ง",
    "ดึงเข้าหาท้องโดยกดสะบักเข้าหากัน ศอกชิดลำตัว",
    "ปล่อยกลับช้า ๆ จนแขนตึง รู้สึกยืดที่ปีก (อย่าโน้มตัวตาม)",
  ],
  "Goblet Squat": [
    "ถือดัมเบล/เคตเทิลเบลแนบอกด้วยสองมือ เท้ากว้างเท่าหัวไหล่",
    "ย่อลงตรง ๆ ดันเข่าออก หลังตรง อกตั้ง ลงจนต้นขาขนานพื้น",
    "ดันส้นเท้าขึ้นยืน เกร็งก้น",
  ],
  "Dumbbell Curl + Triceps Pushdown (ซูเปอร์เซ็ต)": [
    "Curl: หนีบศอกชิดลำตัว ยกดัมเบลด้วยกล้ามแขนหน้า ไม่เหวี่ยงตัว ลดลงช้า ๆ",
    "Pushdown: หนีบศอกชิดลำตัว ดันสายเคเบิลลงจนแขนตึง บีบกล้ามแขนหลัง",
    "ทำ 2 ท่าติดกันไม่พัก (ซูเปอร์เซ็ต) แล้วค่อยพักท้ายรอบ",
  ],
};

export const progressionTips: string[] = [
  "เป้าจำนวนครั้งเป็น “ช่วง” (เช่น 6–8) — เริ่มที่ช่วงล่างก่อน แล้วค่อย ๆ เพิ่มครั้งให้ถึงช่วงบน",
  "Double progression: ทำได้ครบช่วงบน (เช่น 8 ครั้ง) ครบทุกเซ็ตเมื่อไหร่ → ครั้งหน้าเพิ่มน้ำหนัก ~2.5 กก. แล้วเริ่มที่ช่วงล่างใหม่",
  "ยังไม่ถึงช่วงบน → คงน้ำหนักเดิม เน้นทำให้ได้ครั้งเพิ่มขึ้นก่อน",
  "Deload: ทุก ~6 สัปดาห์ ลดน้ำหนักลง ~40–50% สัก 1 สัปดาห์ ให้ข้อต่อ/ระบบประสาทฟื้น แล้วกลับมาแรงขึ้น",
  "หัวใจคือ progressive overload — ค่อย ๆ เพิ่มภาระ (น้ำหนัก/ครั้ง/เซ็ต) ทีละนิดอย่างสม่ำเสมอ กล้ามถึงจะโต",
];
```

- [ ] **Step 4: export ใน `src/data/index.ts`**

เพิ่มบรรทัด:

```ts
export { exerciseCues, progressionTips } from "./workout-guide";
```

- [ ] **Step 5: รันเทสต์ ให้ผ่าน**

Run: `bun test src/lib`
Expected: PASS ทั้งหมด (referential ผ่าน = ครบ 15 ท่า)

- [ ] **Step 6: build + commit**

Run: `bun run build` → ผ่าน

```bash
git add src/data/workout-guide.ts src/data/index.ts src/lib/workout-guide.test.ts
git commit -m "feat(workout): exercise form cues + progression tips data"
```

---

## Task 2: UI — cue ในการ์ดท่า + การ์ด progression

**Files:**
- Modify: `src/components/exercise-card.tsx`, `src/components/views/workout-view.tsx`

**Interfaces:**
- Consumes: `exerciseCues`, `progressionTips` จาก `@/data` (Task 1)

- [ ] **Step 1: แก้ `src/components/exercise-card.tsx` — เพิ่ม `<details>` ดูฟอร์ม**

เขียนไฟล์ใหม่ทั้งไฟล์:

```tsx
import type { Exercise } from "@/data/types";
import { exerciseCues } from "@/data";

export function ExerciseCard({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}) {
  const cues = exerciseCues[exercise.name];

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <span className="tnum mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{exercise.name}</p>
        <p className="text-xs text-muted-foreground">{exercise.muscle}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="text-muted-foreground">
            เซ็ต ×{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.sets}
            </span>
          </span>
          <span className="text-muted-foreground">
            ครั้ง{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.reps}
            </span>
          </span>
          <span className="text-muted-foreground">
            พัก{" "}
            <span className="tnum font-semibold text-foreground">
              {exercise.rest}
            </span>
          </span>
        </div>
        {cues && cues.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              ดูฟอร์ม
            </summary>
            <ul className="mt-1.5 space-y-1">
              {cues.map((c, i) => (
                <li
                  key={i}
                  className="flex gap-1.5 text-xs leading-snug text-muted-foreground"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: แก้ `src/components/views/workout-view.tsx` — เพิ่มการ์ด progression**

อัปเดต import บรรทัดแรก + เพิ่ม import progressionTips:

```tsx
import { Clock, Flame, Snowflake, Moon, Check, TrendingUp } from "lucide-react";
import type { ResolvedDay } from "@/data/types";
import { progressionTips } from "@/data";
import { ExerciseCard } from "@/components/exercise-card";
import { SectionTitle, BulletList } from "@/components/blocks";
import { dayTypeInfo } from "@/components/day-type-badge";
import { Button } from "@/components/ui/button";
```

เพิ่ม section ใหม่หลังบล็อกคูลดาวน์ (ก่อน `</div>` ปิดสุดท้าย):

```tsx
      {/* คูลดาวน์ */}
      <section>
        <SectionTitle icon={<Snowflake className="size-4" />}>
          คูลดาวน์
        </SectionTitle>
        <BulletList items={workout.cooldown} />
      </section>

      {/* progression (เฉพาะวันเล่นเวต) */}
      {type === "weights" && (
        <section>
          <SectionTitle icon={<TrendingUp className="size-4" />}>
            เพิ่มน้ำหนักยังไง (progression)
          </SectionTitle>
          <BulletList items={progressionTips} />
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: build + เทสต์ + ตรวจเบราว์เซอร์**

Run: `bun run build` → ผ่าน
Run: `bun test src/lib` → PASS
ตรวจ: แท็บออกกำลัง (วันเล่นเวต เช่น จันทร์) — แต่ละท่ามี "ดูฟอร์ม" แตะแล้วกางเห็น cue เป็นข้อ ๆ; ท้ายหน้ามีการ์ด "เพิ่มน้ำหนักยังไง (progression)"; วันคาร์ดิโอ (อังคาร) — ไม่มีการ์ด progression; วันพัก — หน้าว่างเหมือนเดิม

- [ ] **Step 4: commit**

```bash
git add src/components/exercise-card.tsx src/components/views/workout-view.tsx
git commit -m "feat(workout): form cues in exercise cards + progression guide card"
```

---

## Self-Review (ผู้เขียนแผนตรวจเองแล้ว)

**Spec coverage:**
- ฟอร์มท่า cue 15 ท่าวันเล่นเวต → Task 1 (data) + Task 2 (`<details>` ใน exercise-card) ✓
- คู่มือ progression → Task 1 (`progressionTips`) + Task 2 (การ์ดใน workout-view, วันเล่นเวต) ✓
- cue map ไม่แตะ Exercise type/week.ts → Task 1 (keyed by name) ✓
- เทสต์ referential (ครบ 15 ท่า) + เนื้อหา → Task 1 ✓

**Placeholder scan:** ไม่มี TBD/TODO — โค้ดครบทุก step (cue ครบ 15 ท่า, progressionTips 5 ข้อ) ✓

**Type consistency:** `exerciseCues: Record<string,string[]>`, `progressionTips: string[]`, ชื่อท่าใน map ตรงกับ week.ts (15 ตัว), `type === "weights"` guard ตรงกับ workout-view ที่ return early เฉพาะ rest ✓

**Scope:** หนึ่งสเปคคอนเทนต์ออกกำลัง (2 tasks) เหมาะกับ 1 แผน ✓
