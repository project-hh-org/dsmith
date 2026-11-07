export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
  emptyText?: string;
}

// 최근 주문 목록. 색·간격·글꼴 크기는 design-system/tokens.css 변수를 사용한다.
export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p
        style={{
          padding: "var(--space-4)",
          textAlign: "center",
          fontSize: "var(--text-xs)",
          color: "var(--color-gray-500)",
        }}
      >
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {orders.map((order, index) => (
        <li
          key={order.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--color-blue-900)",
            borderTop: index === 0 ? "none" : "1px solid var(--color-gray-100)",
          }}
        >
          <span style={{ flex: 1, fontWeight: 500 }}>{order.orderNumber}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span style={{ flex: 1, textAlign: "right" }}>{order.amount.toLocaleString("ko-KR")}원</span>
          <span style={{ flex: 1, textAlign: "right", color: "var(--color-gray-500)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
