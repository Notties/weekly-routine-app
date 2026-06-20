import * as React from "react";
import { Microwave, Egg, CookingPot, Flame, Salad } from "lucide-react";
import type { Appliance } from "@/data/types";

const APPLIANCE_ICON: Record<
  Appliance,
  React.ComponentType<{ className?: string }>
> = {
  กระทะไฟฟ้า: Flame,
  ไมโครเวฟ: Microwave,
  เครื่องต้มไข่: Egg,
  หม้อหุงข้าว: CookingPot,
  ไม่ต้องปรุง: Salad,
};

/** แถวป้ายบอกอุปกรณ์ที่ใช้ทำมื้อนั้น (มือใหม่หยิบเครื่องถูก) */
export function EquipmentBadges({ equipment }: { equipment?: Appliance[] }) {
  if (!equipment || equipment.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {equipment.map((item) => {
        const Icon = APPLIANCE_ICON[item];
        return (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            <Icon className="size-3" />
            {item}
          </span>
        );
      })}
    </div>
  );
}
