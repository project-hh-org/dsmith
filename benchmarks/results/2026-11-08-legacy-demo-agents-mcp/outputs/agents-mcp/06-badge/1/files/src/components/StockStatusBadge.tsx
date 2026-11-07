import clsx from "clsx";
import type { HTMLAttributes } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; className: string }> = {
  enough: {
    label: "충분",
    className: "bg-[var(--color-blue-400)] text-[var(--color-gray-50)]",
  },
  low: {
    label: "부족",
    className: "bg-[var(--color-gray-100)] text-[var(--color-red-500)]",
  },
  soldOut: {
    label: "품절",
    className: "bg-[var(--color-red-500)] text-[var(--color-gray-50)]",
  },
};

export interface StockStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
}

/** 재고 상태(충분·부족·품절)를 보여 주는 배지. 색·간격·모서리·글꼴 크기는 모두 디자인 토큰 변수를 쓴다. */
export function StockStatusBadge({ status, className, ...props }: StockStatusBadgeProps) {
  const { label, className: tone } = config[status];
  return (
    <span
      className={clsx(
        "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)] text-[length:var(--text-xs)] font-medium",
        tone,
        className,
      )}
      {...props}
    >
      {label}
    </span>
  );
}
