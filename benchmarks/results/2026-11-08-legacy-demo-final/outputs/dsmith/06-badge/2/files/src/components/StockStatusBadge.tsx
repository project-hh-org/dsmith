import type { CSSProperties, HTMLAttributes } from "react";

export type StockStatus = "sufficient" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; style: CSSProperties }> = {
  sufficient: {
    label: "충분",
    style: { background: "var(--color-gray-100)", color: "var(--color-blue-900)" },
  },
  low: {
    label: "부족",
    style: { background: "var(--color-blue-400)", color: "var(--color-gray-50)" },
  },
  soldOut: {
    label: "품절",
    style: { background: "var(--color-red-500)", color: "var(--color-gray-50)" },
  },
};

export interface StockStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
}

export function StockStatusBadge({ status, style, ...props }: StockStatusBadgeProps) {
  const { label, style: statusStyle } = config[status];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        lineHeight: 1,
        ...statusStyle,
        ...style,
      }}
      {...props}
    >
      {label}
    </span>
  );
}
