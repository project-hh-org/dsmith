import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  /** 누적 주문 수 */
  orderCount: number;
  /** 회원 등급 (예: VIP, Gold) */
  grade: string;
}

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-4)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-blue-900)",
};

const label: CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

// Badge는 아직 골격(구현 전)이라 쓰지 않고 토큰으로 직접 만든다.
const gradeBadge: CSSProperties = {
  display: "inline-block",
  padding: "0 var(--space-2)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  fontSize: "var(--text-xs)",
};

export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>{name}</p>
        <span style={gradeBadge}>{grade}</span>
      </div>
      <p style={{ ...label, margin: 0 }}>{email}</p>
      <div>
        <p style={{ ...label, margin: 0 }}>누적 주문</p>
        <p style={{ margin: 0 }}>{orderCount.toLocaleString("ko-KR")}건</p>
      </div>
    </div>
  );
}
