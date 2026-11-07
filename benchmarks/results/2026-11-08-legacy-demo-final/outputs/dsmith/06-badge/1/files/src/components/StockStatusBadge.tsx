import type { CSSProperties } from "react";

export type StockStatus = "sufficient" | "low" | "soldOut";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수만 사용한다.
const config: Record<StockStatus, { label: string; style: CSSProperties }> = {
  sufficient: {
    label: "충분",
    style: { background: "var(--color-blue-400)", color: "var(--color-gray-50)" },
  },
  low: {
    label: "부족",
    style: { background: "var(--color-gray-100)", color: "var(--color-blue-900)" },
  },
  soldOut: {
    label: "품절",
    style: { background: "var(--color-red-500)", color: "var(--color-gray-50)" },
  },
};

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  const { label, style } = config[status];
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        borderRadius: "var(--radius-full)",
        padding: "var(--space-2) var(--space-3)",
        fontSize: "var(--text-xs)",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
