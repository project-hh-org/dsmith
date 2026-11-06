import clsx from "clsx";
import { Badge } from "./Badge";

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  status: InventoryStatus;
}

interface InventoryTableProps {
  items: InventoryItem[];
  emptyText?: string;
}

// 재고가 이 수량 미만이면 행을 강조한다
const LOW_STOCK_THRESHOLD = 10;

const STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: "판매중",
  low_stock: "재고 부족",
  out_of_stock: "품절",
};

const STATUS_COLOR: Record<InventoryStatus, "blue" | "gray" | "red"> = {
  in_stock: "blue",
  low_stock: "gray",
  out_of_stock: "red",
};

export function InventoryTable({ items, emptyText }: InventoryTableProps) {
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
          const isLow = item.quantity < LOW_STOCK_THRESHOLD;
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
                  "px-4 py-[11px] text-right tabular-nums",
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
