import { Button } from "@/components/ui/button";

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
      className={`flex gap-ds-2 rounded-ds-sm bg-ds-gray-50 p-ds-2 ${className ?? ""}`.trim()}
    >
      {ORDER_STATUS_TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <Button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            variant={selected ? "default" : "ghost"}
            size="sm"
            className="text-ds-xs"
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
