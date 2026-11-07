export interface RecentOrder {
  id: string;
  orderNo: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-ds-4 text-center text-ds-xs text-ds-gray-500">
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ds-gray-100 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-ds-4 px-ds-4 py-ds-3">
          <span className="w-32 shrink-0 text-ds-xs text-ds-gray-500">{order.orderNo}</span>
          <span className="flex-1 truncate text-ds-xs text-ds-blue-900">{order.customerName}</span>
          <span className="text-ds-xs font-medium text-ds-blue-900">₩{won.format(order.amount)}</span>
          <span className="w-ds-5 min-w-16 text-right text-ds-xs text-ds-gray-500">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
