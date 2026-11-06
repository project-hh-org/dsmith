"use client";

import clsx from "clsx";

export type OrderStatusTabValue = "all" | "paid" | "shipping" | "delivered";

const TABS: { value: OrderStatusTabValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "delivered", label: "완료" },
];

interface OrderStatusTabsProps {
  value: OrderStatusTabValue;
  onChange: (value: OrderStatusTabValue) => void;
}

export function OrderStatusTabs({ value, onChange }: OrderStatusTabsProps) {
  return (
    <div role="tablist" aria-label="주문 상태" className="flex gap-1 border-b border-gray-200">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              active
                ? "border-brand font-medium text-brand"
                : "border-transparent text-gray-700 hover:bg-gray-100",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
