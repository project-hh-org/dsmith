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
  emptyText?: string;
}

const LOW_STOCK_THRESHOLD = 10;

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
};

const headCellStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-4)",
  fontWeight: 500,
  color: "var(--color-gray-500)",
  background: "var(--color-gray-50)",
  textAlign: "left",
};

const cellStyle: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
};

const lowStockRowStyle: CSSProperties = {
  background: "color-mix(in srgb, var(--color-red-500) 10%, transparent)",
  boxShadow: "inset 3px 0 0 var(--color-red-500)",
};

const lowStockTextStyle: CSSProperties = {
  color: "var(--color-red-500)",
  fontWeight: 700,
};

export function InventoryTable({ items, emptyText }: InventoryTableProps) {
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
          <th style={headCellStyle}>상품명</th>
          <th style={headCellStyle}>SKU</th>
          <th style={{ ...headCellStyle, textAlign: "right" }}>재고 수량</th>
          <th style={headCellStyle}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < LOW_STOCK_THRESHOLD;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              style={{
                borderTop: "1px solid var(--color-gray-100)",
                ...(isLow ? lowStockRowStyle : null),
              }}
            >
              <td style={cellStyle}>{item.name}</td>
              <td style={{ ...cellStyle, color: "var(--color-gray-500)" }}>{item.sku}</td>
              <td style={{ ...cellStyle, textAlign: "right", ...(isLow ? lowStockTextStyle : null) }}>
                {item.quantity}
              </td>
              <td style={{ ...cellStyle, ...(isLow ? lowStockTextStyle : null) }}>{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
