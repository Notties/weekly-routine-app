import { describe, it, expect, mock, beforeEach } from "bun:test";

// mock supabase client ก่อน import auth — type กว้างพอรับ mockResolvedValueOnce ทุกเคส
const getUser = mock(async (_token: string): Promise<{ data: { user: { id: string } | null }; error: { message: string } | null }> => ({ data: { user: null }, error: null }));
mock.module("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

const { requireUser } = await import("./auth");
const { ApiError } = await import("./http");

function req(headers: Record<string, string> = {}) {
  return new Request("http://x/api", { headers });
}

beforeEach(() => {
  getUser.mockReset();
});

describe("requireUser", () => {
  it("ไม่มี Authorization header → ApiError 401", async () => {
    expect(requireUser(req())).rejects.toBeInstanceOf(ApiError);
  });

  it("token ใช้ไม่ได้ → ApiError 401", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "bad" } });
    expect(requireUser(req({ Authorization: "Bearer xxx" }))).rejects.toBeInstanceOf(ApiError);
  });

  it("token ใช้ได้ → คืน userId", async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: "u-123" } }, error: null });
    const id = await requireUser(req({ Authorization: "Bearer good" }));
    expect(id).toBe("u-123");
  });
});
