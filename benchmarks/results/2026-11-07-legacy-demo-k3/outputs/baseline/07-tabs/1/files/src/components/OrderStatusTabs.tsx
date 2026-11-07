import type { OrderStatus } from "@/components/common/StatusBadge";

export type OrderStatusTabValue = "all" | Exclude<OrderStatus, "refunded">;

const TABS: { value: OrderStatusTabValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "delivered", label: "완료" },
];

interface OrderStatusTabsProps {
  value: OrderStatusTabValue;
  onChange: (value: OrderStatusTabValue) => void;
  className?: string;
}

export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div role="tablist" className={`flex gap-1 border-b border-gray-300 ${className ?? ""}`}>
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              selected
                ? "border-brand font-medium text-brand"
                : "border-transparent text-gray-700 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
