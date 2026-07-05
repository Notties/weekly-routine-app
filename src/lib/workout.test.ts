import { describe, it, expect } from "bun:test";
import type { DayLog, ISODate } from "@/data/types";
import {
  parseRestSeconds,
  parseRepRange,
  lastLift,
  suggestProgression,
  personalRecords,
} from "./workout";

describe("parseRestSeconds", () => {
  it("\"120 วิ\" → 120", () => {
    expect(parseRestSeconds("120 วิ")).toBe(120);
  });
  it("\"45 วิ\" → 45", () => {
    expect(parseRestSeconds("45 วิ")).toBe(45);
  });
  it("รูปแบบที่ไม่ใช่วินาทีล้วน → null", () => {
    expect(parseRestSeconds("-")).toBeNull();
    expect(parseRestSeconds("คาบในเซ็ต")).toBeNull();
    expect(parseRestSeconds("35 นาที โซน 2")).toBeNull();
  });
});

describe("parseRepRange", () => {
  it("ช่วง en-dash \"6–8\"", () => {
    expect(parseRepRange("6–8")).toEqual({ low: 6, high: 8 });
  });
  it("ช่วง hyphen \"8-10\"", () => {
    expect(parseRepRange("8-10")).toEqual({ low: 8, high: 10 });
  });
  it("ตัวเลขเดี่ยว \"8\" → low=high", () => {
    expect(parseRepRange("8")).toEqual({ low: 8, high: 8 });
  });
  it("รูปแบบอื่น → null", () => {
    expect(parseRepRange("12 ก้าว/ข้าง")).toBeNull();
    expect(parseRepRange("45 วิ")).toBeNull();
    expect(parseRepRange("12+12")).toBeNull();
  });
});

describe("lastLift", () => {
  const log: Record<ISODate, DayLog> = {
    "2026-06-01": { lifts: { "Barbell Squat": [{ kg: 60, reps: 8 }] } },
    "2026-06-08": { lifts: { "Barbell Squat": [{ kg: 62.5, reps: 6 }] } },
    "2026-06-15": { lifts: { "Bench Press": [{ kg: 50, reps: 8 }] } },
  };
  it("เลือกวันล่าสุดก่อน beforeISO ที่มีท่านั้น", () => {
    expect(lastLift(log, "Barbell Squat", "2026-06-15")).toEqual({
      date: "2026-06-08",
      sets: [{ kg: 62.5, reps: 6 }],
    });
  });
  it("ไม่นับวันเดียวกับ beforeISO หรือหลังจากนั้น", () => {
    expect(lastLift(log, "Barbell Squat", "2026-06-08")).toEqual({
      date: "2026-06-01",
      sets: [{ kg: 60, reps: 8 }],
    });
  });
  it("ข้ามเซ็ตที่ reps = 0 (ยังไม่กรอก)", () => {
    const l: Record<ISODate, DayLog> = {
      "2026-06-01": { lifts: { Deadlift: [{ kg: 0, reps: 0 }] } },
    };
    expect(lastLift(l, "Deadlift", "2026-06-15")).toBeNull();
  });
  it("ไม่มีประวัติ → null", () => {
    expect(lastLift({}, "Plank", "2026-06-15")).toBeNull();
  });
});

describe("suggestProgression", () => {
  it("ทำครบช่วงบนทุกเซ็ต → เพิ่มน้ำหนัก step", () => {
    const s = suggestProgression("6–8", {
      sets: [
        { kg: 60, reps: 8 },
        { kg: 60, reps: 8 },
      ],
    });
    expect(s.kind).toBe("increase");
    expect(s.targetKg).toBe(62.5);
  });
  it("ยังไม่ครบช่วงบน → คงน้ำหนัก", () => {
    const s = suggestProgression("6–8", {
      sets: [
        { kg: 60, reps: 8 },
        { kg: 60, reps: 6 },
      ],
    });
    expect(s.kind).toBe("hold");
  });
  it("ดูเฉพาะเซ็ตที่น้ำหนักสูงสุด (warm-up เบากว่าไม่นับ)", () => {
    const s = suggestProgression("8", {
      sets: [
        { kg: 40, reps: 10 },
        { kg: 60, reps: 8 },
        { kg: 60, reps: 8 },
      ],
    });
    expect(s.kind).toBe("increase");
    expect(s.targetKg).toBe(62.5);
  });
  it("ไม่มี last → none", () => {
    expect(suggestProgression("6–8", null).kind).toBe("none");
  });
  it("reps แบบไม่รองรับ → none", () => {
    expect(
      suggestProgression("12 ก้าว/ข้าง", { sets: [{ kg: 20, reps: 12 }] }).kind
    ).toBe("none");
  });
});

describe("personalRecords", () => {
  const log: Record<ISODate, DayLog> = {
    "2026-06-01": {
      lifts: {
        "Barbell Squat": [
          { kg: 60, reps: 8 },
          { kg: 60, reps: 8 },
        ],
        "Bench Press": [{ kg: 50, reps: 8 }],
      },
    },
    "2026-06-08": {
      lifts: {
        "Barbell Squat": [{ kg: 62.5, reps: 6 }],
        "Bench Press": [{ kg: 50, reps: 10 }],
      },
    },
    "2026-06-15": {
      lifts: { Deadlift: [{ kg: 0, reps: 0 }] }, // เซ็ตว่าง ไม่นับ
    },
  };

  it("เลือกน้ำหนักมากสุดต่อท่า และเรียงหนักสุดก่อน", () => {
    const prs = personalRecords(log);
    expect(prs.map((p) => p.exercise)).toEqual(["Barbell Squat", "Bench Press"]);
    expect(prs[0]).toEqual({
      exercise: "Barbell Squat",
      kg: 62.5,
      reps: 6,
      date: "2026-06-08",
    });
  });

  it("น้ำหนักเท่ากัน → เอาครั้ง (reps) มากกว่า", () => {
    const prs = personalRecords(log);
    const bench = prs.find((p) => p.exercise === "Bench Press")!;
    expect(bench).toEqual({
      exercise: "Bench Press",
      kg: 50,
      reps: 10,
      date: "2026-06-08",
    });
  });

  it("เซ็ตว่าง (kg/reps = 0) ไม่ถูกนับเป็นสถิติ", () => {
    expect(
      personalRecords(log).some((p) => p.exercise === "Deadlift")
    ).toBe(false);
  });

  it("ทำได้เท่าสถิติเดิมเป๊ะ → คงวันแรกที่ทำได้", () => {
    const l: Record<ISODate, DayLog> = {
      "2026-06-01": { lifts: { Plank: [{ kg: 20, reps: 10 }] } },
      "2026-06-08": { lifts: { Plank: [{ kg: 20, reps: 10 }] } },
    };
    expect(personalRecords(l)[0].date).toBe("2026-06-01");
  });

  it("log ว่าง → []", () => {
    expect(personalRecords({})).toEqual([]);
  });
});
