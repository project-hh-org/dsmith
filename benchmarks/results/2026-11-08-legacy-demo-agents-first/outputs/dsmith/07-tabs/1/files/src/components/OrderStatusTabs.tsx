import clsx from "clsx";
import { Button } from "./ui/button";

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
  className?: string;
}

export function OrderStatusTabs({ value, onChange, className }: OrderStatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="주문 상태"
      className={clsx(
        "inline-flex gap-[var(--space-2)] rounded-[var(--radius-full)] bg-[var(--color-gray-50)] p-[var(--space-2)]",
        className,
      )}
    >
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <Button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            size="sm"
            variant={selected ? "default" : "ghost"}
            className={clsx(
              "rounded-[var(--radius-full)] text-[length:var(--text-xs)]",
              selected && "font-bold",
            )}
            onClick={() => {
              if (!selected) onChange(tab.value);
            }}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
