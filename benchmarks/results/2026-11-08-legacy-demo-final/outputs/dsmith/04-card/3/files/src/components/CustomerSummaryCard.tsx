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
};

const label: CSSProperties = {
  color: "var(--color-gray-500)",
  fontSize: "var(--text-xs)",
};

const gradePill: CSSProperties = {
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  borderRadius: "var(--radius-full)",
  padding: "0 var(--space-2)",
  fontSize: "var(--text-xs)",
};

// 고객 이름·이메일·누적 주문 수·회원 등급 요약 카드.
// Badge는 골격(구현 전)이라 쓰지 않고 등급은 토큰 스타일의 span으로 표시한다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <p style={{ color: "var(--color-blue-900)", fontSize: "var(--text-xl)", margin: 0 }}>{name}</p>
        <span style={gradePill}>{grade}</span>
      </div>
      <p style={{ ...label, margin: 0, marginTop: "var(--space-2)" }}>{email}</p>
      <dl style={{ margin: 0, marginTop: "var(--space-4)" }}>
        <dt style={label}>누적 주문 수</dt>
        <dd style={{ color: "var(--color-blue-900)", margin: 0 }}>{orderCount.toLocaleString()}건</dd>
      </dl>
    </div>
  );
}
