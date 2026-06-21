-- เปิด RLS แบบ deny-all (ไม่มี policy) บนทุกตาราง
-- กันไม่ให้ publishable key (public) เข้าถึงตารางผ่าน PostgREST ได้โดยตรง
-- Prisma ต่อด้วย role postgres ที่ bypass RLS จึงยังทำงานได้ปกติ
alter table "Profile" enable row level security;
alter table "Swap" enable row level security;
alter table "CheckedItem" enable row level security;
alter table "DayLog" enable row level security;
alter table "MealCheck" enable row level security;
alter table "LiftSet" enable row level security;
