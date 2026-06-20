/** จัดรูปแบบจำนวนเงินบาท เช่น 1450 → "฿1,450" */
export function baht(n: number): string {
  return "฿" + Math.round(n).toLocaleString("en-US");
}
