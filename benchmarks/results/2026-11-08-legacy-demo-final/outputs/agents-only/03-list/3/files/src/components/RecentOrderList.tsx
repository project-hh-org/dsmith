export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
}

// 최근 주문 목록. 값은 모두 design-system/tokens.css 의 CSS 변수를 사용한다.
export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {orders.map((order, i) => (
        <li
          key={order.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            borderTop: i === 0 ? "none" : "1px solid var(--color-gray-100)",
            fontSize: "var(--text-xs)",
            color: "var(--color-blue-900)",
          }}
        >
          <span style={{ color: "var(--color-gray-500)" }}>{order.id}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span>{order.amount.toLocaleString("ko-KR")}원</span>
          <span style={{ color: "var(--color-gray-500)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
