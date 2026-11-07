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

// 최근 주문 목록. 한 줄에 주문번호·고객명·금액·상태, 항목 사이는 구분선. 값은 DS 토큰(ds- 클래스)만 사용
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
        <li
          key={order.id}
          className="flex items-center justify-between gap-ds-4 px-ds-4 py-ds-3 text-ds-xs"
        >
          <span className="text-ds-gray-500">{order.orderNo}</span>
          <span className="flex-1 truncate text-ds-blue-900">{order.customerName}</span>
          <span className="text-ds-blue-900">{won.format(order.amount)}원</span>
          <span className="text-ds-blue-400">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
