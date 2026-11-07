import type { CSSProperties } from "react";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조한다. 기본 10 */
  lowStockThreshold?: number;
}

const cell: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  textAlign: "left",
  borderBottom: "1px solid var(--color-gray-100)",
  fontSize: "var(--text-xs)",
};

const headCell: CSSProperties = {
  ...cell,
  background: "var(--color-gray-50)",
  color: "var(--color-gray-500)",
  fontWeight: 600,
};

export function InventoryTable({ items, lowStockThreshold = 10 }: InventoryTableProps) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
        color: "var(--color-blue-900)",
      }}
    >
      <thead>
        <tr>
          <th style={headCell}>상품명</th>
          <th style={headCell}>SKU</th>
          <th style={{ ...headCell, textAlign: "right" }}>재고 수량</th>
          <th style={headCell}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          const rowStyle: CSSProperties = low
            ? {
                background: "var(--color-gray-50)",
                color: "var(--color-red-500)",
                fontWeight: 600,
                boxShadow: "inset 4px 0 0 var(--color-red-500)",
              }
            : {};
          return (
            <tr key={item.id} style={rowStyle} data-low-stock={low || undefined}>
              <td style={cell}>{item.name}</td>
              <td style={cell}>{item.sku}</td>
              <td style={{ ...cell, textAlign: "right" }}>{item.quantity}</td>
              <td style={cell}>{low ? "재고 부족" : "정상"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
