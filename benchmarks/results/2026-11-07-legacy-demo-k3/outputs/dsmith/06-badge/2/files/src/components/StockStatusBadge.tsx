import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

// 색은 design-system/tokens.css 변수만 사용한다.
const config: Record<StockStatus, { label: string; style: string }> = {
  sufficient: {
    label: "충분",
    style: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    style: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  },
  soldOut: {
    label: "품절",
    style: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
  },
};

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, style } = config[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] text-[length:var(--text-xs)]",
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
