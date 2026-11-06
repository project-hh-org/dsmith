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

// 최근 주문 목록: 한 줄에 주문번호·고객명·금액·상태, 항목 사이 구분선. 값은 모두 디자인 토큰(CSS 변수) 사용.
export function RecentOrderList({ orders, emptyText = "최근 주문이 없습니다." }: RecentOrderListProps) {
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
        {emptyText}
      </p>
    );
  }

  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        background: "var(--color-gray-50)",
        borderRadius: "var(--radius-sm)",
      }}
    >
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
          <span style={{ fontWeight: 500 }}>{order.orderNo}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span style={{ textAlign: "right" }}>{won.format(order.amount)}원</span>
          <span style={{ color: "var(--color-gray-500)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
