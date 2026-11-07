export interface RecentOrder {
  id: string;
  customerName: string;
  amount: number;
  status: string;
}

interface RecentOrderListProps {
  orders: RecentOrder[];
}

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {orders.map((order, index) => (
        <li
          key={order.id}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-4)",
            padding: "var(--space-3) 0",
            borderTop: index === 0 ? "none" : "1px solid var(--color-gray-100)",
          }}
        >
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
            {order.id}
          </span>
          <span style={{ flex: 1, color: "var(--color-blue-900)" }}>{order.customerName}</span>
          <span style={{ color: "var(--color-blue-900)" }}>{won.format(order.amount)}원</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
            {order.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
