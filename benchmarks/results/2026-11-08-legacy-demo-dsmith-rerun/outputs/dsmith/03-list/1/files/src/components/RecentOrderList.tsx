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

// 최근 주문 목록. 색·간격·글꼴 크기는 design-system/tokens.css 변수만 사용한다.
export function RecentOrderList({ orders, emptyText = "최근 주문이 없습니다." }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p className="p-[var(--space-4)] text-center text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="m-0 list-none p-0 bg-[color:var(--color-gray-50)] rounded-[var(--radius-sm)]">
      {orders.map((order, index) => (
        <li
          key={order.id}
          className={`flex items-center justify-between gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)] ${
            index > 0 ? "border-t border-solid border-[color:var(--color-gray-100)]" : ""
          }`}
        >
          <span className="font-medium">{order.orderNo}</span>
          <span className="flex-1 truncate">{order.customerName}</span>
          <span className="text-right">{won.format(order.amount)}원</span>
          <span className="text-[color:var(--color-gray-500)]">{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
