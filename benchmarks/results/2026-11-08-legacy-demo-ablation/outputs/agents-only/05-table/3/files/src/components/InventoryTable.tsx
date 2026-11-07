import clsx from "clsx";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
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
    return <p className="p-ds-4 text-center text-ds-gray-500">{emptyText ?? "재고 데이터가 없습니다."}</p>;
  }

  const headerCell = "px-ds-4 py-ds-3 font-medium text-ds-blue-900";

  return (
    <table className="w-full border border-ds-gray-100 bg-white">
      <thead className="bg-ds-gray-50">
        <tr>
          <th scope="col" className={clsx(headerCell, "text-left")}>상품명</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>SKU</th>
          <th scope="col" className={clsx(headerCell, "text-right")}>재고 수량</th>
          <th scope="col" className={clsx(headerCell, "text-left")}>상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.stock < lowStockThreshold;
          return (
            <tr
              key={item.id}
              data-low-stock={isLow || undefined}
              className={clsx("border-t border-ds-gray-100", isLow && "bg-ds-gray-50")}
            >
              <td className={clsx("px-ds-4 py-ds-3", isLow ? "font-medium text-ds-red-500" : "text-ds-blue-900")}>
                {item.name}
              </td>
              <td className="px-ds-4 py-ds-3 text-ds-gray-500">{item.sku}</td>
              <td
                className={clsx(
                  "px-ds-4 py-ds-3 text-right tabular-nums",
                  isLow ? "font-medium text-ds-red-500" : "text-ds-blue-900",
                )}
              >
                {item.stock.toLocaleString()}
              </td>
              <td className="px-ds-4 py-ds-3">
                <span
                  className={clsx(
                    "inline-block rounded-ds-full px-ds-2 text-ds-xs",
                    isLow ? "bg-ds-red-500 text-white" : "bg-ds-gray-100 text-ds-blue-900",
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
