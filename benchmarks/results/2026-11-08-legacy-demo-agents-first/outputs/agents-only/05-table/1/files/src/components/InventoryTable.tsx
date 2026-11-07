import clsx from "clsx";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status?: InventoryStatus;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조한다. 기본 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: "재고 있음",
  low_stock: "재고 부족",
  out_of_stock: "품절",
};

function resolveStatus(item: InventoryItem, threshold: number): InventoryStatus {
  if (item.quantity <= 0) return "out_of_stock";
  if (item.quantity < threshold) return "low_stock";
  return item.status ?? "in_stock";
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table className="w-full border border-[var(--color-gray-100)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]">
      <thead className="bg-[var(--color-gray-50)]">
        <tr>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium">상품명</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium">SKU</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-right font-medium">재고 수량</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          const status = resolveStatus(item, lowStockThreshold);
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              className={clsx(
                "border-t border-[var(--color-gray-100)]",
                low && "bg-[var(--color-gray-50)] font-medium text-[var(--color-red-500)]",
              )}
            >
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.name}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.sku}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-right tabular-nums">
                {item.quantity.toLocaleString("ko-KR")}
              </td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)]",
                    low
                      ? "bg-[var(--color-red-500)] text-[var(--color-gray-50)]"
                      : "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
                  )}
                >
                  {STATUS_LABEL[status]}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
