// อ่าน/เขียน state เล็ก ๆ ลง localStorage (ปลอดภัยกับ SSR/static export)

const CHECKED_KEY = "knot-gym:checked";
const DAY_KEY = "knot-gym:day";
const SWAPS_KEY = "knot-gym:swaps";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** สถานะติ๊กถูกของรายการซื้อของ: { [itemKey]: true } */
export function getChecked(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, boolean>>(
    window.localStorage.getItem(CHECKED_KEY),
    {}
  );
}

export function setChecked(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  const current = getChecked();
  if (value) {
    current[key] = true;
  } else {
    delete current[key];
  }
  window.localStorage.setItem(CHECKED_KEY, JSON.stringify(current));
}

/** ล้างสถานะติ๊กทั้งหมด (เริ่มซื้อรอบใหม่) */
export function clearChecked(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHECKED_KEY);
}

/** วันที่เลือกล่าสุด */
export function getSelectedDay(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DAY_KEY);
}

export function setSelectedDay(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY_KEY, key);
}

/** การสลับเมนู: { "<dayKey>:<mealIndex>": recipeId } */
export function getSwaps(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, string>>(
    window.localStorage.getItem(SWAPS_KEY),
    {}
  );
}

export function setSwap(key: string, recipeId: string): void {
  if (typeof window === "undefined") return;
  const current = getSwaps();
  current[key] = recipeId;
  window.localStorage.setItem(SWAPS_KEY, JSON.stringify(current));
}

/** ยกเลิกการสลับ (กลับไปใช้เมนูเริ่มต้นของมื้อนั้น) */
export function clearSwap(key: string): void {
  if (typeof window === "undefined") return;
  const current = getSwaps();
  delete current[key];
  window.localStorage.setItem(SWAPS_KEY, JSON.stringify(current));
}
