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

const cellStyle: CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
};

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p
        style={{
          padding: "var(--space-4)",
          textAlign: "center",
          color: "var(--color-gray-500)",
          fontSize: "var(--text-xs)",
        }}
      >
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "var(--text-xs)",
        border: "1px solid var(--color-gray-100)",
      }}
    >
      <thead style={{ background: "var(--color-gray-50)" }}>
        <tr>
          <th style={{ ...cellStyle, textAlign: "left" }}>상품명</th>
          <th style={{ ...cellStyle, textAlign: "left" }}>SKU</th>
          <th style={{ ...cellStyle, textAlign: "right" }}>재고 수량</th>
          <th style={{ ...cellStyle, textAlign: "left" }}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              style={{
                borderTop: "1px solid var(--color-gray-100)",
                boxShadow: isLow ? "inset var(--space-2) 0 0 -4px var(--color-red-500)" : undefined,
                color: isLow ? "var(--color-red-500)" : undefined,
                fontWeight: isLow ? 600 : undefined,
              }}
            >
              <td style={cellStyle}>{item.name}</td>
              <td style={{ ...cellStyle, color: isLow ? undefined : "var(--color-gray-500)" }}>{item.sku}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>{item.quantity}</td>
              <td style={cellStyle}>{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
