import clsx from "clsx";

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

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table className="w-full border border-[var(--color-gray-100)] bg-white text-[length:var(--text-xs)]">
      <thead className="bg-[var(--color-gray-50)]">
        <tr>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">상품명</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">SKU</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-right font-medium text-[var(--color-blue-900)]">재고 수량</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              className={clsx(
                "border-t border-[var(--color-gray-100)]",
                low && "border-l-4 border-l-[var(--color-red-500)] bg-[var(--color-gray-50)]",
              )}
            >
              <td className={clsx("px-[var(--space-4)] py-[var(--space-3)]", low && "font-medium")}>{item.name}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-[var(--color-gray-500)]">{item.sku}</td>
              <td
                className={clsx(
                  "px-[var(--space-4)] py-[var(--space-3)] text-right",
                  low && "font-medium text-[var(--color-red-500)]",
                )}
              >
                {item.quantity}
              </td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">
                {item.status}
                {low && <span className="ml-[var(--space-2)] text-[var(--color-red-500)]">재고 부족</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
