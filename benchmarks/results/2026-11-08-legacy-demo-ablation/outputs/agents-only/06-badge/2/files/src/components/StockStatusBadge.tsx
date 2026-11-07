import type { CSSProperties } from "react";

export type StockStatus = "sufficient" | "low" | "soldOut";

const LABELS: Record<StockStatus, string> = {
  sufficient: "충분",
  low: "부족",
  soldOut: "품절",
};

// 디자인 토큰(design-system/tokens.css)의 CSS 변수만 사용한다.
const STATUS_STYLES: Record<StockStatus, CSSProperties> = {
  sufficient: {
    backgroundColor: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
  },
  low: {
    backgroundColor: "var(--color-gray-100)",
    color: "var(--color-blue-900)",
    border: "1px solid var(--color-gray-500)",
  },
  soldOut: {
    backgroundColor: "var(--color-red-500)",
    color: "var(--color-gray-50)",
  },
};

const BASE_STYLE: CSSProperties = {
  display: "inline-block",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-full)",
  fontSize: "var(--text-xs)",
  lineHeight: 1,
  fontWeight: 500,
  whiteSpace: "nowrap",
};

export interface StockStatusBadgeProps {
  status: StockStatus;
  className?: string;
}

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  return (
    <span
      className={className}
      style={{ ...BASE_STYLE, ...STATUS_STYLES[status] }}
      data-status={status}
    >
      {LABELS[status]}
    </span>
  );
}
