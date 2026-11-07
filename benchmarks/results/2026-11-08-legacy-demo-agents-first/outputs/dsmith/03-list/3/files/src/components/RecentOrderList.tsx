export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
}

const amountFormatter = new Intl.NumberFormat("ko-KR");

// 최근 주문 목록. 한 줄에 주문번호·고객명·금액·상태, 항목 사이는 구분선.
export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul className="divide-y divide-ds-gray-100 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50">
      {orders.map((order) => (
        <li key={order.id} className="flex items-center gap-ds-4 px-ds-4 py-ds-3">
          <span className="text-ds-xs text-ds-gray-500">{order.id}</span>
          <span className="flex-1 text-ds-blue-900">{order.customerName}</span>
          <span className="font-medium text-ds-blue-900">{amountFormatter.format(order.amount)}원</span>
          <span className="text-ds-xs text-ds-gray-500">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
