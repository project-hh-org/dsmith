"use client";

import { Button } from "@/components/ui/button";

export const ORDER_STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "완료" },
] as const;

export type OrderStatus = (typeof ORDER_STATUS_TABS)[number]["value"];

interface OrderStatusTabsProps {
  value: OrderStatus;
  onChange: (value: OrderStatus) => void;
}

export function OrderStatusTabs({ value, onChange }: OrderStatusTabsProps) {
  return (
    <div role="tablist" aria-label="주문 상태" className="inline-flex gap-[var(--space-2)]">
      {ORDER_STATUS_TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <Button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            size="sm"
            variant={selected ? "default" : "ghost"}
            onClick={() => {
              if (!selected) onChange(tab.value);
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
