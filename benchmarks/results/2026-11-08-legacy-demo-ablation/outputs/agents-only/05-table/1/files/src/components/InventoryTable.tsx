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
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const headerCell =
  "px-[var(--space-4)] py-[var(--space-2)] font-medium text-[color:var(--color-gray-500)]";
const bodyCell = "px-[var(--space-4)] py-[var(--space-3)]";

export function InventoryTable({
  items,
  lowStockThreshold = 10,
  emptyText = "재고 데이터가 없습니다.",
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText}
      </p>
    );
  }

  return (
    <table className="w-full border border-[color:var(--color-gray-100)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]">
      <thead className="bg-[color:var(--color-gray-50)]">
        <tr>
          <th scope="col" className={clsx(headerCell, "text-left")}>상품명</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>SKU</th>
          <th scope="col" className={clsx(headerCell, "text-right")}>재고 수량</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>상태</th>
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
                isLow && "bg-[color:var(--color-gray-50)] shadow-[inset_4px_0_0_var(--color-red-500)]",
              )}
            >
              <td className={clsx(bodyCell, isLow && "font-medium")}>{item.name}</td>
              <td className={clsx(bodyCell, "text-[color:var(--color-gray-500)]")}>{item.sku}</td>
              <td
                className={clsx(
                  bodyCell,
                  "text-right tabular-nums",
                  isLow && "font-medium text-[color:var(--color-red-500)]",
                )}
              >
                {item.quantity}
                {isLow && <span className="sr-only"> (재고 부족)</span>}
              </td>
              <td className={bodyCell}>
                <span
                  className={clsx(
                    "inline-block rounded-[var(--radius-full)] px-[var(--space-2)] py-[calc(var(--space-2)/2)]",
                    isLow
                      ? "bg-[color:var(--color-red-500)] text-white"
                      : "bg-[color:var(--color-gray-100)] text-[color:var(--color-blue-900)]",
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
