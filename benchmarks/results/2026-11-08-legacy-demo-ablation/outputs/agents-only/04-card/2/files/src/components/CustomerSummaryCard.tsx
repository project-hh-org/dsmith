export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 토큰(design-system/tokens.css)의 CSS 변수만 사용합니다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div
      style={{
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <p style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-blue-900)" }}>
          {name}
        </p>
        <span
          style={{
            background: "var(--color-blue-400)",
            color: "var(--color-gray-50)",
            borderRadius: "var(--radius-full)",
            padding: "0 var(--space-3)",
            fontSize: "var(--text-xs)",
          }}
        >
          {grade}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>{email}</p>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-blue-900)" }}>
        누적 주문 {orderCount.toLocaleString()}건
      </p>
    </div>
  );
}
