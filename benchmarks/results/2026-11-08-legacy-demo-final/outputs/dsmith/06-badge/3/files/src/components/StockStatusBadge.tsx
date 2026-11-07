import type { CSSProperties } from "react";

export type StockStatus = "enough" | "low" | "soldout";

interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 변수만 사용한다.
const config: Record<StockStatus, { label: string; style: CSSProperties }> = {
  enough: {
    label: "충분",
    style: { background: "var(--color-blue-400)", color: "var(--color-gray-50)" },
  },
  low: {
    label: "부족",
    style: { background: "var(--color-gray-100)", color: "var(--color-blue-900)" },
  },
  soldout: {
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
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        ...style,
      }}
    >
      {label}
    </span>
  );
}
