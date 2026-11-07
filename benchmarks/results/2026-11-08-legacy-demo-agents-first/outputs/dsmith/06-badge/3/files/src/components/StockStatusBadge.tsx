import type { CSSProperties } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

const config: Record<StockStatus, { label: string; style: CSSProperties }> = {
  enough: {
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

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

// DS의 Badge는 아직 골격(구현 전)이라 쓰지 않고, 토큰 변수만으로 직접 구성했다.
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
