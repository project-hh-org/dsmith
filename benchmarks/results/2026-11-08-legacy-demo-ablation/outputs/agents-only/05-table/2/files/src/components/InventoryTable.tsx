import type { CSSProperties } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10. */
  lowStockThreshold?: number;
  emptyText?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용합니다.
const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-xs)",
  border: "1px solid var(--color-gray-100)",
};

const headStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  textAlign: "left",
  fontWeight: 500,
  color: "var(--color-gray-500)",
  background: "var(--color-gray-50)",
};

const cellStyle: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  color: "var(--color-blue-900)",
  borderTop: "1px solid var(--color-gray-100)",
};

const statusStyle: CSSProperties = {
  display: "inline-block",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-full)",
  border: "1px solid var(--color-gray-100)",
  color: "var(--color-gray-500)",
};

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p style={{ padding: "var(--space-4)", textAlign: "center", color: "var(--color-gray-500)" }}>
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={headStyle}>상품명</th>
          <th style={headStyle}>SKU</th>
          <th style={{ ...headStyle, textAlign: "right" }}>재고 수량</th>
          <th style={headStyle}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          const rowStyle: CSSProperties = isLow
            ? { background: "var(--color-gray-50)", boxShadow: "inset 4px 0 0 var(--color-red-500)" }
            : {};

          return (
            <tr key={item.id} style={rowStyle} data-low-stock={isLow || undefined}>
              <td style={{ ...cellStyle, fontWeight: isLow ? 600 : 400 }}>{item.name}</td>
              <td style={{ ...cellStyle, color: "var(--color-gray-500)" }}>{item.sku}</td>
              <td
                style={{
                  ...cellStyle,
                  textAlign: "right",
                  fontWeight: isLow ? 600 : 400,
                  color: isLow ? "var(--color-red-500)" : cellStyle.color,
                }}
              >
                {item.quantity}
              </td>
              <td style={cellStyle}>
                <span
                  style={
                    isLow
                      ? { ...statusStyle, color: "var(--color-red-500)", borderColor: "var(--color-red-500)" }
                      : statusStyle
                  }
                >
                  {item.status}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
