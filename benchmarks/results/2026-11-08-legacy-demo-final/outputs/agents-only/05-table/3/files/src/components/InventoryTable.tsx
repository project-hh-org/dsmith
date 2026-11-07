import clsx from "clsx";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

export interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조한다. 기본값 10 */
  lowStockThreshold?: number;
  className?: string;
}

const cell = "px-[var(--space-4)] py-[var(--space-3)] text-left";

export function InventoryTable({ items, lowStockThreshold = 10, className }: InventoryTableProps) {
  return (
    <table
      className={clsx(
        "w-full border-collapse text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]",
        className,
      )}
    >
      <thead>
        <tr className="bg-[color:var(--color-gray-50)] text-[color:var(--color-gray-500)]">
          <th scope="col" className={cell}>상품명</th>
          <th scope="col" className={cell}>SKU</th>
          <th scope="col" className={clsx(cell, "text-right")}>재고 수량</th>
          <th scope="col" className={cell}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const low = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={low || undefined}
              className="border-t border-[color:var(--color-gray-100)]"
            >
              <td className={clsx(cell, low && "font-medium")}>{item.name}</td>
              <td className={clsx(cell, "text-[color:var(--color-gray-500)]")}>{item.sku}</td>
              <td
                className={clsx(
                  cell,
                  "text-right tabular-nums",
                  low && "font-medium text-[color:var(--color-red-500)]",
                )}
              >
                {item.quantity}
              </td>
              <td className={cell}>
                {low ? (
                  <span className="inline-block rounded-[var(--radius-full)] border border-[color:var(--color-red-500)] px-[var(--space-2)] text-[color:var(--color-red-500)]">
                    {item.status}
                  </span>
                ) : (
                  item.status
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
