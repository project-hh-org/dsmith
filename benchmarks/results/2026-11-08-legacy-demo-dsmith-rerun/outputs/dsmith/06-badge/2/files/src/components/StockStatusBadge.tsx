import clsx from "clsx";

export type StockStatus = "enough" | "low" | "soldOut";

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수만 사용한다.
// (DS Badge는 아직 골격이라 쓰지 않고, 같은 모양을 토큰으로 직접 구성)
const statusStyles: Record<StockStatus, { label: string; className: string }> = {
  enough: {
    label: "충분",
    className:
      "bg-[var(--color-gray-100)] text-[var(--color-gray-500)] border-[var(--color-gray-100)]",
  },
  low: {
    label: "부족",
    className:
      "bg-[var(--color-gray-50)] text-[var(--color-red-500)] border-[var(--color-red-500)]",
  },
  soldOut: {
    label: "품절",
    className:
      "bg-[var(--color-red-500)] text-[var(--color-gray-50)] border-[var(--color-red-500)]",
  },
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, className: statusClass } = statusStyles[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] border px-[var(--space-2)] text-[length:var(--text-xs)] leading-[var(--space-5)]",
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  );
}
