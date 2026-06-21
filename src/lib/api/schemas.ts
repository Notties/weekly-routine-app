import { z } from "zod";

export const ProfileSchema = z.object({
  goal: z.string().nullable().optional(),
  heightCm: z.number().int().nullable().optional(),
  age: z.number().int().nullable().optional(),
  workoutWindow: z.string().nullable().optional(),
});
export type ProfileInput = z.infer<typeof ProfileSchema>;

export const DayScalarSchema = z.object({
  weightKg: z.number().nullable().optional(),
  workoutDone: z.boolean().optional(),
  waterMl: z.number().int().min(0).optional(),
  extraKcal: z.number().int().nullable().optional(),
  extraProtein: z.number().int().nullable().optional(),
});
export type DayScalarInput = z.infer<typeof DayScalarSchema>;

export const LiftSetsSchema = z.object({
  sets: z.array(z.object({ kg: z.number(), reps: z.number().int() })),
});
export type LiftSetsInput = z.infer<typeof LiftSetsSchema>;

export const SwapSchema = z.object({ recipeId: z.string().min(1) });
