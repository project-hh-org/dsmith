import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
const statusStyles: Record<StockStatus, { label: string; className: string }> = {
  sufficient: {
    label: "충분",
    className: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    className: "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
  },
  soldOut: {
    label: "품절",
    className: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
  },
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, className: statusClassName } = statusStyles[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/4)] text-[length:var(--text-xs)] font-medium",
        statusClassName,
        className,
      )}
    >
      {label}
    </span>
  );
}
