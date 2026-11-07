import clsx from "clsx";
import { Badge } from "./Badge";

export type InventoryStatus = "active" | "soldout" | "hidden";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: InventoryStatus;
}

interface InventoryTableProps {
  items: InventoryItem[];
  /** 이 수량 미만이면 행을 강조합니다. 기본값 10 */
  lowStockThreshold?: number;
  emptyText?: string;
}

const STATUS_LABEL: Record<InventoryStatus, string> = {
  active: "판매중",
  soldout: "품절",
  hidden: "숨김",
};

const STATUS_COLOR: Record<InventoryStatus, "blue" | "gray" | "red"> = {
  active: "blue",
  soldout: "red",
  hidden: "gray",
};

export function InventoryTable({ items, lowStockThreshold = 10, emptyText }: InventoryTableProps) {
  if (items.length === 0) {
    return <p className="p-4 text-center text-gray-500">{emptyText ?? "재고 데이터가 없습니다."}</p>;
  }

  return (
    <table className="w-full text-sm bg-white border border-[#E5E7EB]">
      <thead className="bg-[#F9FAFB]">
        <tr>
          <th className="px-4 py-2 font-medium text-gray-700 text-left">상품명</th>
          <th className="px-4 py-2 font-medium text-gray-700 text-left">SKU</th>
          <th className="px-4 py-2 font-medium text-gray-700 text-right">재고 수량</th>
          <th className="px-4 py-2 font-medium text-gray-700 text-left">상태</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const isLow = item.quantity < lowStockThreshold;
          return (
            <tr
              key={item.id}
              className={clsx("border-t border-gray-200", isLow && "bg-red-50")}
              data-low-stock={isLow || undefined}
            >
              <td className="px-4 py-[11px]">{item.name}</td>
              <td className="px-4 py-[11px] text-gray-500">{item.sku}</td>
              <td
                className={clsx(
                  "px-4 py-[11px] text-right",
                  isLow && "font-semibold text-[#EF4444]",
                )}
              >
                {item.quantity.toLocaleString("ko-KR")}
              </td>
              <td className="px-4 py-[11px]">
                <Badge color={STATUS_COLOR[item.status]}>{STATUS_LABEL[item.status]}</Badge>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
