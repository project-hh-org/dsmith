import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

const card: CSSProperties = {
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-4)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const gradeBadge: CSSProperties = {
  display: "inline-block",
  alignSelf: "flex-start",
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  borderRadius: "var(--radius-full)",
  padding: "var(--space-2) var(--space-3)",
  fontSize: "var(--text-xs)",
};

// 고객 요약 카드: 이름·이메일·누적 주문 수·회원 등급
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div style={card}>
      <p style={{ color: "var(--color-blue-900)", fontSize: "var(--text-xl)", margin: 0 }}>{name}</p>
      <p style={{ color: "var(--color-gray-500)", fontSize: "var(--text-xs)", margin: 0 }}>{email}</p>
      <p style={{ color: "var(--color-blue-900)", fontSize: "var(--text-xs)", margin: 0 }}>
        누적 주문 {orderCount.toLocaleString()}건
      </p>
      <span style={gradeBadge}>{grade}</span>
    </div>
  );
}
