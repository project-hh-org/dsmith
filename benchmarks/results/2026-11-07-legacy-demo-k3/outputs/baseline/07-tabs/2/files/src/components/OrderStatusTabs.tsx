import clsx from "clsx";

export type OrderStatusTab = "all" | "paid" | "shipping" | "delivered";

const TABS: { value: OrderStatusTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "delivered", label: "완료" },
];

interface OrderStatusTabsProps {
  value: OrderStatusTab;
  onChange: (value: OrderStatusTab) => void;
  className?: string;
}

// 디자인 시스템 토큰(design-system/tokens.css)의 CSS 변수를 사용한다.
export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="주문 상태"
      className={clsx("flex gap-2 border-b border-[var(--color-gray-100)]", className)}
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
              "-mb-px border-b-2 px-4 py-2 text-sm",
              selected
                ? "border-[var(--color-blue-400)] font-semibold text-[var(--color-blue-400)]"
                : "border-transparent text-[var(--color-gray-500)] hover:text-[var(--color-blue-900)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
