export type InventoryStatus = "판매중" | "품절" | "단종" | (string & {});

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: InventoryStatus;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조한다. 기본 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const cellStyle = {
  padding: "var(--space-3) var(--space-4)",
} as const;

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
        fontSize: "var(--text-xs)",
        borderCollapse: "collapse",
        border: "1px solid var(--color-gray-100)",
      }}
    >
      <thead style={{ background: "var(--color-gray-50)" }}>
        <tr>
          <th scope="col" style={{ ...cellStyle, textAlign: "left" }}>상품명</th>
          <th scope="col" style={{ ...cellStyle, textAlign: "left" }}>SKU</th>
          <th scope="col" style={{ ...cellStyle, textAlign: "right" }}>재고 수량</th>
          <th scope="col" style={{ ...cellStyle, textAlign: "left" }}>상태</th>
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
                color: low ? "var(--color-red-500)" : undefined,
                fontWeight: low ? 600 : undefined,
                // 색만으로 구분하지 않도록 좌측 막대도 함께 표시
                boxShadow: low ? "inset var(--space-2) 0 0 -4px var(--color-red-500)" : undefined,
              }}
            >
              <td style={cellStyle}>{item.name}</td>
              <td style={cellStyle}>{item.sku}</td>
              <td style={{ ...cellStyle, textAlign: "right" }}>
                {item.quantity.toLocaleString()}
                {low && <span style={{ marginLeft: "var(--space-2)" }}>재고 부족</span>}
              </td>
              <td style={cellStyle}>{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
