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
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {orders.map((order, i) => (
        <li
          key={order.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            padding: "var(--space-3) var(--space-4)",
            fontSize: "var(--text-xs)",
            color: "var(--color-blue-900)",
            borderTop: i === 0 ? "none" : "1px solid var(--color-gray-100)",
          }}
        >
          <span style={{ flex: "0 0 auto", color: "var(--color-gray-500)" }}>{order.orderNo}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{order.customerName}</span>
          <span style={{ flex: "0 0 auto", fontWeight: 600 }}>{won.format(order.amount)}원</span>
          <span style={{ flex: "0 0 auto", color: "var(--color-blue-400)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
