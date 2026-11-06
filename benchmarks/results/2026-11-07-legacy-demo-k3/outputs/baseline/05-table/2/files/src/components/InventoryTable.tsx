import clsx from "clsx";
import { Badge } from "./Badge";
import { EmptyState } from "./EmptyState";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  status: string;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return <EmptyState title={emptyText ?? "재고 데이터가 없습니다."} />;
  }

  return (
    <table className="w-full text-sm bg-white border border-[#E5E7EB]">
      <thead className="bg-[#F9FAFB]">
        <tr>
          <th className="px-4 py-2 text-left font-medium text-gray-700">상품명</th>
          <th className="px-4 py-2 text-left font-medium text-gray-700">SKU</th>
          <th className="px-4 py-2 text-right font-medium text-gray-700">재고 수량</th>
          <th className="px-4 py-2 text-left font-medium text-gray-700">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.stock < lowStockThreshold;
          return (
            <tr
              key={item.id}
              className={clsx("border-t border-gray-200", isLow && "bg-[#EF4444]/10")}
            >
              <td className="px-4 py-[11px]">{item.name}</td>
              <td className="px-4 py-[11px] text-gray-500">{item.sku}</td>
              <td className={clsx("px-4 py-[11px] text-right", isLow && "font-semibold text-[#EF4444]")}>
                {item.stock.toLocaleString("ko-KR")}
              </td>
              <td className="px-4 py-[11px]">
                <Badge color={isLow ? "red" : "gray"}>{item.status}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
