import type { HTMLAttributes } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; color: string; background: string }> = {
  enough: { label: "충분", color: "var(--color-blue-400)", background: "var(--color-gray-50)" },
  low: { label: "부족", color: "var(--color-gray-500)", background: "var(--color-gray-100)" },
  soldOut: { label: "품절", color: "var(--color-red-500)", background: "var(--color-gray-50)" },
};

export interface StockStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
}

export function StockStatusBadge({ status, style, ...props }: StockStatusBadgeProps) {
  const { label, color, background } = config[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0 var(--space-2)",
        borderRadius: "var(--radius-full)",
        border: `1px solid ${color}`,
        color,
        background,
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
