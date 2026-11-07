import type { CSSProperties } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 변수만 사용한다.
const config: Record<StockStatus, { label: string; style: CSSProperties }> = {
  enough: {
    label: "충분",
    style: { background: "var(--color-blue-400)", color: "var(--color-gray-50)" },
  },
  low: {
    label: "부족",
    style: { background: "var(--color-red-500)", color: "var(--color-gray-50)" },
  },
  soldOut: {
    label: "품절",
    style: { background: "var(--color-gray-100)", color: "var(--color-gray-500)" },
  },
};

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  const { label, style } = config[status];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0 var(--space-2)",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
