import type { CSSProperties } from "react";

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

const listStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  fontSize: "var(--text-xs)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-3) var(--space-4)",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid var(--color-gray-100)",
};

const formatAmount = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return (
      <p
        style={{
          padding: "var(--space-4)",
          textAlign: "center",
          color: "var(--color-gray-500)",
          fontSize: "var(--text-xs)",
        }}
      >
        {emptyText ?? "최근 주문이 없습니다."}
      </p>
    );
  }

  return (
    <ul style={listStyle}>
      {orders.map((order, index) => (
        <li key={order.id} style={index === 0 ? rowStyle : { ...rowStyle, ...dividerStyle }}>
          <span style={{ color: "var(--color-blue-900)", fontWeight: 500 }}>{order.orderNumber}</span>
          <span style={{ flex: 1, color: "var(--color-blue-900)" }}>{order.customerName}</span>
          <span style={{ color: "var(--color-blue-900)" }}>{formatAmount(order.amount)}</span>
          <span style={{ color: "var(--color-gray-500)" }}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
