import { Badge, type OrderStatus } from "@/components/common/StatusBadge";
import { formatWon } from "@/lib/format";

export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: OrderStatus;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p className="p-4 text-center text-gray-500">{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul className="bg-white border border-gray-200 divide-y divide-gray-200 text-sm">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-4 px-4 py-3">
          <span className="w-32 shrink-0 font-medium text-gray-700">{order.orderNo}</span>
          <span className="flex-1 truncate">{order.customerName}</span>
          <span className="text-right">{formatWon(order.amount)}</span>
          <Badge status={order.status} />
        </li>
      ))}
    </ul>
  );
}
