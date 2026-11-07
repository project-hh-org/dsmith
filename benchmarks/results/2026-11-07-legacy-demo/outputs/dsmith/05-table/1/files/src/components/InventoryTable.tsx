import type { CSSProperties } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수를 씁니다.
const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-xs)",
  border: "1px solid var(--color-gray-100)",
};

const headStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  background: "var(--color-gray-50)",
  color: "var(--color-gray-500)",
  fontWeight: 500,
};

const cellStyle: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  borderTop: "1px solid var(--color-gray-100)",
};

const statusStyle: CSSProperties = {
  display: "inline-block",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-gray-50)",
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
          <th style={{ ...headStyle, textAlign: "left" }}>상품명</th>
          <th style={{ ...headStyle, textAlign: "left" }}>SKU</th>
          <th style={{ ...headStyle, textAlign: "right" }}>재고 수량</th>
          <th style={{ ...headStyle, textAlign: "left" }}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          const rowStyle: CSSProperties = low
            ? { background: "var(--color-gray-50)", color: "var(--color-red-500)", fontWeight: 600 }
            : { color: "var(--color-blue-900)" };

          return (
            <tr key={item.id} style={rowStyle} data-low-stock={low || undefined}>
              <td style={cellStyle}>{item.name}</td>
              <td style={cellStyle}>{item.sku}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{item.quantity}</td>
              <td style={cellStyle}>
                <span
                  style={
                    low
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
