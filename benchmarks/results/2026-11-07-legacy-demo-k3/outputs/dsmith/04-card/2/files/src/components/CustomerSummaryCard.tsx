import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 (예: "VIP", "Gold") */
  tier: string;
  className?: string;
}

// 색·간격·모서리·글꼴 크기는 design-system/tokens.css 의 CSS 변수만 사용한다.
const styles: Record<string, CSSProperties> = {
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-3)",
    padding: "var(--space-4)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--radius-sm)",
    background: "var(--color-gray-50)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "var(--space-2)",
  },
  name: {
    margin: 0,
    fontSize: "var(--text-xl)",
    fontWeight: 700,
    color: "var(--color-blue-900)",
  },
  tier: {
    padding: "0 var(--space-2)",
    borderRadius: "var(--radius-full)",
    background: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
    fontSize: "var(--text-xs)",
  },
  email: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  orders: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  ordersValue: {
    color: "var(--color-blue-900)",
    fontWeight: 700,
  },
};

export function CustomerSummaryCard({
  name,
  email,
  orderCount,
  tier,
  className,
}: CustomerSummaryCardProps) {
  return (
    <section className={className} style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span style={styles.tier}>{tier}</span>
      </div>
      <p style={styles.email}>{email}</p>
      <div style={styles.orders}>
        <span>누적 주문 수</span>
        <span style={styles.ordersValue}>{orderCount.toLocaleString("ko-KR")}건</span>
      </div>
    </section>
  );
}
