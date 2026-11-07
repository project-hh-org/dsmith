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
  className?: string;
}

const listStyle: CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-4)",
  padding: "var(--space-3) var(--space-4)",
  fontSize: "var(--text-xs)",
  color: "var(--color-blue-900)",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid var(--color-gray-100)",
};

const orderNoStyle: CSSProperties = {
  flex: "0 0 auto",
  color: "var(--color-gray-500)",
};

const customerStyle: CSSProperties = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const amountStyle: CSSProperties = {
  flex: "0 0 auto",
  fontVariantNumeric: "tabular-nums",
};

const statusStyle: CSSProperties = {
  flex: "0 0 auto",
  color: "var(--color-gray-500)",
};

const amountFormatter = new Intl.NumberFormat("ko-KR");

export function RecentOrderList({ orders, className }: RecentOrderListProps) {
  return (
    <ul className={className} style={listStyle}>
      {orders.map((order, index) => (
        <li key={order.id} style={index > 0 ? { ...rowStyle, ...dividerStyle } : rowStyle}>
          <span style={orderNoStyle}>{order.orderNo}</span>
          <span style={customerStyle}>{order.customerName}</span>
          <span style={amountStyle}>{amountFormatter.format(order.amount)}원</span>
          <span style={statusStyle}>{order.status}</span>
        </li>
      ))}
    </ul>
  );
}
