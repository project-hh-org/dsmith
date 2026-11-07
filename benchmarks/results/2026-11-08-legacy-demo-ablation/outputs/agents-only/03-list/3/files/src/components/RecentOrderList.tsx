export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  status: string;
}

export interface RecentOrderListProps {
  orders: RecentOrder[];
}

const won = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders }: RecentOrderListProps) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {orders.map((order, i) => (
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
            borderTop: i === 0 ? "none" : "1px solid var(--color-gray-100)",
          }}
        >
          <span style={{ color: "var(--color-gray-500)" }}>{order.orderNumber}</span>
          <span style={{ flex: 1 }}>{order.customerName}</span>
          <span>{won.format(order.amount)}원</span>
          <span style={{ color: "var(--color-gray-500)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
