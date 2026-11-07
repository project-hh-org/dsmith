import type { CSSProperties, HTMLAttributes } from "react";

export type StockStatus = "in-stock" | "low" | "sold-out";

const labels: Record<StockStatus, string> = {
  "in-stock": "충분",
  low: "부족",
  "sold-out": "품절",
};

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 변수만 사용한다.
const statusStyles: Record<StockStatus, CSSProperties> = {
  "in-stock": {
    color: "var(--color-blue-400)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-blue-400)",
  },
  low: {
    color: "var(--color-red-500)",
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-red-500)",
  },
  "sold-out": {
    color: "var(--color-gray-50)",
    background: "var(--color-red-500)",
    border: "1px solid var(--color-red-500)",
  },
};

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-full)",
  fontSize: "var(--text-xs)",
  fontWeight: 500,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

export interface StockStatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  status: StockStatus;
}

export function StockStatusBadge({ status, style, ...props }: StockStatusBadgeProps) {
  return (
    <span
      data-status={status}
      style={{ ...baseStyle, ...statusStyles[status], ...style }}
      {...props}
    >
      {labels[status]}
    </span>
  );
}
