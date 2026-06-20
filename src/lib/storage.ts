// อ่าน/เขียน state เล็ก ๆ ลง localStorage (ปลอดภัยกับ SSR/static export)

const CHECKED_KEY = "knot-gym:checked";
const DAY_KEY = "knot-gym:day";

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
