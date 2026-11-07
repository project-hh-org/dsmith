import type { CSSProperties } from "react";

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

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  background: "var(--color-gray-50)",
  borderRadius: "var(--radius-sm)",
};

const emptyStyle: CSSProperties = {
  padding: "var(--space-4)",
  textAlign: "center",
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  padding: "var(--space-3) var(--space-4)",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid var(--color-gray-100)",
};

const orderNoStyle: CSSProperties = { fontWeight: 600, minWidth: 0 };
const mutedStyle: CSSProperties = { flex: 1, color: "var(--color-gray-500)" };
const amountStyle: CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums" };
const statusStyle: CSSProperties = {
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-gray-100)",
  color: "var(--color-gray-500)",
};

export function RecentOrderList({ orders, emptyText }: RecentOrderListProps) {
  if (orders.length === 0) {
    return <p style={emptyStyle}>{emptyText ?? "최근 주문이 없습니다."}</p>;
  }

  return (
    <ul style={listStyle}>
      {orders.map((order, index) => (
        <li key={order.id} style={index === 0 ? rowStyle : { ...rowStyle, ...dividerStyle }}>
          <span style={orderNoStyle}>{order.orderNo}</span>
          <span style={mutedStyle}>{order.customerName}</span>
          <span style={amountStyle}>{order.amount.toLocaleString("ko-KR")}원</span>
          <span style={statusStyle}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
