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

const cell = "px-ds-4 py-ds-3";

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return <p className="p-ds-4 text-center text-ds-xs text-ds-gray-500">{emptyText ?? "재고 데이터가 없습니다."}</p>;
  }

  return (
    <table className="w-full border border-ds-gray-100 text-ds-xs">
      <thead className="bg-ds-gray-50">
        <tr className="text-ds-gray-500">
          <th scope="col" className={clsx(cell, "text-left font-medium")}>상품명</th>
          <th scope="col" className={clsx(cell, "text-left font-medium")}>SKU</th>
          <th scope="col" className={clsx(cell, "text-right font-medium")}>재고 수량</th>
          <th scope="col" className={clsx(cell, "text-left font-medium")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx("border-t border-ds-gray-100", isLow && "bg-ds-gray-50 text-ds-red-500")}
            >
              <td className={clsx(cell, isLow && "font-medium")}>{item.name}</td>
              <td className={clsx(cell, !isLow && "text-ds-gray-500")}>{item.sku}</td>
              <td className={clsx(cell, "text-right tabular-nums", isLow && "font-medium")}>
                {item.quantity.toLocaleString()}
              </td>
              <td className={cell}>
                <span
                  className={clsx(
                    "inline-block rounded-ds-full px-ds-2",
                    isLow ? "border border-ds-red-500" : "border border-ds-gray-100",
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
