import type { HTMLAttributes } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; color: string }> = {
  enough: { label: "충분", color: "var(--color-blue-400)" },
  low: { label: "부족", color: "var(--color-gray-500)" },
  soldOut: { label: "품절", color: "var(--color-red-500)" },
};

export interface StockStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
}

export function StockStatusBadge({ status, style, ...props }: StockStatusBadgeProps) {
  const { label, color } = config[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0 var(--space-2)",
        borderRadius: "var(--radius-full)",
        border: `1px solid ${color}`,
        background: "var(--color-gray-50)",
        color,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        ...style,
      }}
      {...props}
    >
      {label}
    </span>
  );
}
