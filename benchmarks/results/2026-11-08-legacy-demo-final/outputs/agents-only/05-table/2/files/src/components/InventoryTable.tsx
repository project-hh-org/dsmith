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
  /** 이 수량 미만이면 행을 강조한다. 기본 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const cell: CSSProperties = {
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
        color: "var(--color-blue-900)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <thead style={{ background: "var(--color-gray-50)" }}>
        <tr>
          <th scope="col" style={{ ...cell, textAlign: "left" }}>상품명</th>
          <th scope="col" style={{ ...cell, textAlign: "left" }}>SKU</th>
          <th scope="col" style={{ ...cell, textAlign: "right" }}>재고 수량</th>
          <th scope="col" style={{ ...cell, textAlign: "left" }}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              style={{
                borderTop: "1px solid var(--color-gray-100)",
                background: low ? "var(--color-gray-50)" : undefined,
                boxShadow: low ? "inset var(--space-2) 0 0 -4px var(--color-red-500)" : undefined,
                color: low ? "var(--color-red-500)" : undefined,
                fontWeight: low ? 600 : undefined,
              }}
            >
              <td style={cell}>{item.name}</td>
              <td style={{ ...cell, color: low ? undefined : "var(--color-gray-500)" }}>{item.sku}</td>
              <td style={{ ...cell, textAlign: "right" }}>{item.quantity.toLocaleString()}</td>
              <td style={cell}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "0 var(--space-2)",
                    borderRadius: "var(--radius-full)",
                    border: "1px solid currentColor",
                  }}
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
