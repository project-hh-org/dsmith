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

// 디자인 시스템 토큰(tailwind.preset의 ds-*)만 사용
export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="주문 상태"
      className={clsx("flex gap-ds-2 border-b border-ds-gray-100", className)}
    >
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
              "-mb-px border-b-2 px-ds-4 py-ds-3 text-ds-xs transition-colors",
              selected
                ? "border-ds-blue-400 font-bold text-ds-blue-900"
                : "border-transparent text-ds-gray-500 hover:bg-ds-gray-50",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
