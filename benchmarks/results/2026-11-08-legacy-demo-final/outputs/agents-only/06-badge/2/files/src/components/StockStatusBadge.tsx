import type { HTMLAttributes } from "react";

export type StockStatus = "enough" | "low" | "soldOut";

// 색은 design-system/tokens.css 의 변수만 사용한다. (상태는 색뿐 아니라 라벨 텍스트로도 구분)
const config: Record<StockStatus, { label: string; color: string; background: string; border: string }> = {
  enough: {
    label: "충분",
    color: "var(--color-blue-400)",
    background: "var(--color-gray-50)",
    border: "var(--color-blue-400)",
  },
  low: {
    label: "부족",
    color: "var(--color-blue-900)",
    background: "var(--color-gray-100)",
    border: "var(--color-gray-500)",
  },
  soldOut: {
    label: "품절",
    color: "var(--color-red-500)",
    background: "var(--color-gray-50)",
    border: "var(--color-red-500)",
  },
};

export interface StockStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: StockStatus;
}

export function StockStatusBadge({ status, style, children, ...props }: StockStatusBadgeProps) {
  const { label, color, background, border } = config[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "var(--space-2) var(--space-3)",
        borderRadius: "var(--radius-full)",
        border: `1px solid ${border}`,
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        lineHeight: 1,
        color,
        background,
        ...style,
      }}
      {...props}
    >
      {children ?? label}
    </span>
  );
}
