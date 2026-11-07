import clsx from "clsx";

export type StockStatus = "sufficient" | "low" | "soldOut";

const labels: Record<StockStatus, string> = {
  sufficient: "충분",
  low: "부족",
  soldOut: "품절",
};

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
const styles: Record<StockStatus, string> = {
  sufficient: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  low: "bg-[var(--color-gray-100)] text-[var(--color-blue-900)]",
  soldOut: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/4)] text-[length:var(--text-xs)]",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
