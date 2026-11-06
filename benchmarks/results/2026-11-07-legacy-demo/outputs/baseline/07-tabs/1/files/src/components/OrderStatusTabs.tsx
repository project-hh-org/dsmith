import clsx from "clsx";

export type OrderStatusTabValue = "all" | "paid" | "shipping" | "done";

const TABS: { value: OrderStatusTabValue; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "완료" },
];

interface OrderStatusTabsProps {
  value: OrderStatusTabValue;
  onChange: (value: OrderStatusTabValue) => void;
  className?: string;
}

export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div role="tablist" className={clsx("flex gap-1 border-b border-gray-200", className)}>
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => {
              if (!selected) onChange(tab.value);
            }}
            className={clsx(
              "-mb-px border-b-2 px-4 py-2 text-sm",
              selected
                ? "border-brand font-medium text-brand"
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
