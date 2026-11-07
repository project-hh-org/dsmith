import clsx from "clsx";

export const ORDER_STATUS_TABS = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "완료" },
] as const;

export type OrderStatus = (typeof ORDER_STATUS_TABS)[number]["value"];

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
      className={clsx("flex gap-ds-2 border-b border-ds-gray-100", className)}
    >
      {ORDER_STATUS_TABS.map((tab) => {
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
              "-mb-px border-b-2 px-ds-4 py-ds-3 text-ds-xs transition-colors",
              selected
                ? "border-ds-blue-400 font-bold text-ds-blue-900"
                : "border-transparent font-medium text-ds-gray-500 hover:bg-ds-gray-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
