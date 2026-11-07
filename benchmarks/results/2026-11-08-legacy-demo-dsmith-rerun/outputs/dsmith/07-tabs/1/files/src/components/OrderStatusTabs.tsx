import clsx from "clsx";

export type OrderStatus = "all" | "paid" | "shipping" | "done";

const TABS: { value: OrderStatus; label: string }[] = [
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
    <div role="tablist" aria-label="주문 상태" className={clsx("flex gap-2 border-b border-gray-300", className)}>
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
              "h-10 px-4 text-sm font-medium transition-colors -mb-px border-b-2",
              selected
                ? "border-brand text-brand"
                : "border-transparent text-gray-500 hover:text-gray-900",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
