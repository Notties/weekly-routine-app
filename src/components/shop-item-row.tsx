"use client";

import type { ShopItem } from "@/data/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { baht } from "@/lib/format";

export function ShopItemRow({
  item,
  checked,
  onToggle,
}: {
  item: ShopItem;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 px-1 py-2.5 transition-opacity",
        checked && "opacity-45"
      )}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onToggle(v === true)}
      />
      <span
        className={cn(
          "min-w-0 flex-1 text-sm",
          checked && "line-through decoration-foreground/50"
        )}
      >
        {item.name}
        <span className="ml-2 text-xs text-muted-foreground">{item.qty}</span>
      </span>
      <span
        className={cn(
          "tnum shrink-0 text-sm font-medium",
          checked && "line-through decoration-foreground/50"
        )}
      >
        {baht(item.price)}
      </span>
    </label>
  );
}
