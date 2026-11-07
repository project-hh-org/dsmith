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
    <div role="tablist" aria-label="주문 상태" className="flex gap-1 border-b border-[var(--color-gray-100)]">
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
              selected
                ? "border-[var(--color-blue-400)] text-[var(--color-blue-400)]"
                : "border-transparent text-[var(--color-gray-500)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
