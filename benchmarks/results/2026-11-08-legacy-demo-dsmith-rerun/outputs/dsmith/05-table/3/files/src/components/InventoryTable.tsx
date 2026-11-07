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
  /** 이 수량 미만이면 행을 강조합니다. */
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
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">
            상품명
          </th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">
            SKU
          </th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-right font-medium text-[var(--color-blue-900)]">
            재고 수량
          </th>
          <th className="px-[var(--space-4)] py-[var(--space-2)] text-left font-medium text-[var(--color-blue-900)]">
            상태
          </th>
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
                "border-t border-[var(--color-gray-100)]",
                isLow && "bg-[var(--color-gray-50)] font-medium text-[var(--color-red-500)]",
              )}
            >
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.name}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">{item.sku}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)] text-right">{item.quantity}</td>
              <td className="px-[var(--space-4)] py-[var(--space-3)]">
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-0.5",
                    isLow
                      ? "bg-[var(--color-red-500)] text-white"
                      : "bg-[var(--color-gray-100)] text-[var(--color-gray-500)]",
                  )}
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
