"use client";

import clsx from "clsx";

export type OrderStatus = "all" | "paid" | "shipping" | "done";

const TABS: { value: OrderStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "완료" },
];

interface OrderStatusTabsProps {
  value: OrderStatus;
  onChange: (value: OrderStatus) => void;
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
              "-mb-px px-4 py-2 text-sm border-b-2",
              active
                ? "border-brand text-brand font-medium"
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
