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
  /** 이 수량 미만이면 행을 강조한다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-xs)",
  background: "#fff",
  border: "1px solid var(--color-gray-100)",
};

const headStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  background: "var(--color-gray-50)",
  color: "var(--color-gray-500)",
  fontWeight: 500,
  textAlign: "left",
};

const cellStyle: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  borderTop: "1px solid var(--color-gray-100)",
  color: "var(--color-blue-900)",
};

const lowRowStyle: CSSProperties = {
  background: "var(--color-gray-50)",
  color: "var(--color-red-500)",
  fontWeight: 600,
};

const statusStyle: CSSProperties = {
  display: "inline-block",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-full)",
  border: "1px solid currentColor",
};

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p
        style={{
          padding: "var(--space-4)",
          textAlign: "center",
          fontSize: "var(--text-xs)",
          color: "var(--color-gray-500)",
        }}
      >
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
          const rowStyle = isLow ? lowRowStyle : undefined;
          return (
            <tr key={item.id} data-low-stock={isLow || undefined}>
              <td
                style={{
                  ...cellStyle,
                  ...rowStyle,
                  boxShadow: isLow ? "inset 3px 0 0 var(--color-red-500)" : undefined,
                }}
              >
                {item.name}
              </td>
              <td style={{ ...cellStyle, ...rowStyle }}>{item.sku}</td>
              <td style={{ ...cellStyle, ...rowStyle, textAlign: "right" }}>{item.quantity}</td>
              <td style={{ ...cellStyle, ...rowStyle }}>
                <span style={statusStyle}>{item.status}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
