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
