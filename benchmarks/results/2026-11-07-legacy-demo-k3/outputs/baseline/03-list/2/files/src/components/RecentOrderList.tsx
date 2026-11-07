import clsx from "clsx";
import { Badge, type OrderStatus } from "@/components/common/StatusBadge";
import { formatWon } from "@/lib/format";

export interface RecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
  className?: string;
}

// 최근 주문 목록. 한 줄에 주문번호·주문자·금액·상태, 항목 사이에는 구분선
export function RecentOrderList({ orders, emptyText, className }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p className="p-4 text-center text-gray-500">{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul className={clsx("bg-white border border-gray-200 rounded-lg divide-y divide-gray-200", className)}>
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-4 px-4 py-3 text-sm">
          <span className="w-24 shrink-0 font-medium text-gray-900">{order.id}</span>
          <span className="flex-1 truncate text-gray-700">{order.customer}</span>
          <span className="text-right font-medium text-gray-900">{formatWon(order.amount)}</span>
          <span className="w-20 shrink-0 text-right">
            <Badge status={order.status} />
          </span>
        </li>
      ))}
    </ul>
  );
}
