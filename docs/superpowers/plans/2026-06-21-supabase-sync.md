# Supabase Cloud Sync Implementation Plan

**Goal:** sync `log/swaps/checked/profileOverride` ข้ามอุปกรณ์แบบ offline-first ผ่าน Supabase + magic link; ไม่ตั้ง env = ออฟไลน์เหมือนเดิม

**Architecture:** local (zustand persist) เป็น source of truth · `useSyncEngine` ทำ pull→merge→push (union LWW) · merge logic แยกเป็น pure `sync.ts` (มีเทสต์) · Supabase client null-safe

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript, zustand, @supabase/supabase-js, `bun test`

## Global Constraints

- ไม่มี env → `getSupabase()` = null → ทุกอย่าง no-op, `bun run build` ต้องผ่าน
- sync เฉพาะ slice `{swaps, checked, log, profileOverride}` (ไม่ sync UI-local/timer)
- merge = union (ไม่ทำของหาย) + ฝั่งใหม่ชนะ key ที่ชน; `log` merge ราย day (union meals/lifts)
- RLS: `auth.uid() = user_id`

---

## Task 1: merge logic + เทสต์ (TDD)
- [x] `src/lib/sync.test.ts` (union, key ชน, day merge, profileOverride)
- [x] `src/lib/sync.ts`: `SyncSlice`, `SyncEnvelope`, `mergeSlice`, `pickSyncSlice`
- [x] `bun test src/lib/sync.test.ts` ผ่าน

## Task 2: client + store
- [x] `src/lib/supabase.ts`: `getSupabase()` null-safe, `isSyncConfigured`, `STATE_TABLE`
- [x] `store.ts`: `applyRemoteState(slice)`

## Task 3: engine + UI
- [x] `src/lib/use-sync.ts`: `useSyncStore`, `syncNow`, `signIn`, `signOut`, `useSyncEngine`
- [x] `src/components/sync-card.tsx`: magic link / สถานะ / ซิงค์เดี๋ยวนี้ / ออกระบบ / โหมดไม่ตั้งค่า
- [x] `me-view.tsx`: แสดง `<SyncCard/>` · `routine-app.tsx`: `useSyncEngine()`

## Task 4: docs + verify
- [x] `.env.example`, `docs/supabase-setup.md` (SQL + RLS + วิธีตั้ง)
- [ ] `bun test src/lib` เขียว · `bun run build` ผ่าน (ไม่มี env) · lint สะอาดไฟล์ใหม่
