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
  /** 이 수량 미만이면 행을 강조한다. 기본 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText ?? "재고 데이터가 없습니다."}
      </p>
    );
  }

  return (
    <table className="w-full border border-[color:var(--color-gray-100)] text-left text-[length:var(--text-xs)]">
      <thead className="bg-[color:var(--color-gray-50)]">
        <tr>
          <th className="px-[var(--space-4)] py-[var(--space-2)] font-medium">상품명</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] font-medium">SKU</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-right font-medium">재고 수량</th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] font-medium">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx(
                "border-t border-[color:var(--color-gray-100)]",
                isLow && "bg-[color:var(--color-gray-50)] font-semibold text-[color:var(--color-red-500)]",
              )}
            >
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.name}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.sku}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-right">{item.quantity}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.status}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
