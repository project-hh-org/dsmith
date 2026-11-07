import clsx from "clsx";

export type OrderStatus = "all" | "paid" | "shipping" | "done";

const tabs: { value: OrderStatus; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "완료" },
];

export interface OrderStatusTabsProps {
  value: OrderStatus;
  onChange: (value: OrderStatus) => void;
  className?: string;
}

export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="주문 상태"
      className={clsx(
        "inline-flex gap-[var(--space-2)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-2)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={clsx(
              "rounded-[var(--radius-sm)] px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-xs)] font-medium transition-colors",
              selected
                ? "bg-[var(--color-blue-400)] text-white"
                : "text-[var(--color-gray-500)] hover:bg-[var(--color-gray-100)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
