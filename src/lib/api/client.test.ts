import { describe, it, expect, mock, beforeEach } from "bun:test";

const getSession = mock(async () => ({ data: { session: { access_token: "tok" } } }));
mock.module("@/lib/supabase", () => ({
  getSupabase: () => ({ auth: { getSession } }),
}));

const { apiGet, apiSend, AuthError, NetworkError } = await import("./client");

const realFetch = globalThis.fetch;
beforeEach(() => {
  getSession.mockClear();
  globalThis.fetch = realFetch;
});

describe("apiGet", () => {
  it("แนบ bearer token + คืน json", async () => {
    let seenAuth = "";
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      seenAuth = new Headers(init.headers).get("authorization") ?? "";
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 });
    }) as typeof fetch;
    const data = await apiGet<{ ok: number }>("/api/state");
    expect(seenAuth).toBe("Bearer tok");
    expect(data.ok).toBe(1);
  });

  it("401 → AuthError", async () => {
    globalThis.fetch = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    expect(apiGet("/api/state")).rejects.toBeInstanceOf(AuthError);
  });

  it("fetch reject → NetworkError", async () => {
    globalThis.fetch = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    expect(apiGet("/api/state")).rejects.toBeInstanceOf(NetworkError);
  });
});

describe("apiSend", () => {
  it("ส่ง body JSON + method", async () => {
    let seen: { method?: string; body?: string } = {};
    globalThis.fetch = (async (_url: string, init: RequestInit) => {
      seen = { method: init.method, body: init.body as string };
      return new Response(null, { status: 204 });
    }) as typeof fetch;
    await apiSend("PUT", "/api/profile", { goal: "ลด" });
    expect(seen.method).toBe("PUT");
    expect(JSON.parse(seen.body!)).toEqual({ goal: "ลด" });
  });
});
