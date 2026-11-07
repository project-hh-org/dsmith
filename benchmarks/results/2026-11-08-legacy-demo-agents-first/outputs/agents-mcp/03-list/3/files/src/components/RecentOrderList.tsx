export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: string;
  /** 취소·실패처럼 주의가 필요한 상태면 true */
  danger?: boolean;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p className="p-ds-4 text-center text-ds-xs text-ds-gray-500">{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul className="divide-y divide-ds-gray-100 border border-ds-gray-100 bg-ds-gray-50 rounded-ds-sm">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-ds-4 px-ds-4 py-ds-3 text-ds-xs">
          <span className="w-32 shrink-0 text-ds-gray-500">{order.orderNo}</span>
          <span className="flex-1 truncate text-ds-blue-900">{order.customerName}</span>
          <span className="text-right font-medium text-ds-blue-900">{won.format(order.amount)}원</span>
          <span
            className={`w-16 shrink-0 text-right ${order.danger ? "text-ds-red-500" : "text-ds-gray-500"}`}
          >
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
