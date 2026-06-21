import { describe, it, expect, mock, beforeEach } from "bun:test";

const upsert = mock(async (_args: unknown) => ({}));
const revalidateTag = mock((_t: string, _p: string) => {});
mock.module("@/lib/prisma", () => ({ prisma: { profile: { upsert } } }));
mock.module("next/cache", () => ({ revalidateTag }));
mock.module("@/lib/api/auth", () => ({ requireUser: async () => "u-1" }));

const { PUT } = await import("./route");

function put(body: unknown) {
  return new Request("http://x/api/profile", {
    method: "PUT",
    headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  upsert.mockClear();
  revalidateTag.mockClear();
});

describe("PUT /api/profile", () => {
  it("body ถูกต้อง → upsert filter userId + revalidate", async () => {
    const res = await PUT(put({ goal: "ลด", age: 30 }));
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledTimes(1);
    const arg = upsert.mock.calls[0][0] as { where: { userId: string } };
    expect(arg.where.userId).toBe("u-1");
    expect(revalidateTag).toHaveBeenCalledWith("state:u-1", "max");
  });

  it("body ผิด type → 400", async () => {
    const res = await PUT(put({ age: "ไม่ใช่ตัวเลข" }));
    expect(res.status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });
});
