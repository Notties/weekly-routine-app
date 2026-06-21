import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data as object, { status });
}

/** ครอบ handler: แปลง error เป็น Response มาตรฐาน */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    if (e instanceof ZodError) return json({ error: "invalid body", issues: e.issues }, 400);
    console.error(e);
    return json({ error: "internal error" }, 500);
  }
}
