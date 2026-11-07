import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
  className?: string;
}

const styles = {
  card: {
    background: "var(--color-gray-50)",
    border: "1px solid var(--color-gray-100)",
    borderRadius: "var(--space-3)",
    padding: "var(--space-4)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-2)",
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
  grade: {
    padding: "0 var(--space-2)",
    borderRadius: "var(--radius-full)",
    background: "var(--color-blue-400)",
    color: "var(--color-gray-50)",
    fontSize: "var(--text-xs)",
    fontWeight: 500,
  },
  email: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  orders: {
    margin: 0,
    fontSize: "var(--text-xs)",
    color: "var(--color-blue-900)",
  },
} satisfies Record<string, CSSProperties>;

// 고객 요약 카드: 이름·이메일·누적 주문 수·회원 등급
export function CustomerSummaryCard({
  name,
  email,
  orderCount,
  grade,
  className,
}: CustomerSummaryCardProps) {
  return (
    <div className={className} style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span style={styles.grade}>{grade}</span>
      </div>
      <p style={styles.email}>{email}</p>
      <p style={styles.orders}>누적 주문 {orderCount.toLocaleString("ko-KR")}건</p>
    </div>
  );
}
