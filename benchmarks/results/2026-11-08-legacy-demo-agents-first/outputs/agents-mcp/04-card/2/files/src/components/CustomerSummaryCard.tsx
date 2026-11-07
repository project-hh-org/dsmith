export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 고객 요약 카드. 색·간격·모서리·글꼴 크기는 design-system/tokens.css 변수만 사용한다.
// (Badge는 골격 상태라 쓰지 않고 등급 표시는 인라인으로 처리)
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
            padding: "0 var(--space-2)",
            borderRadius: "var(--radius-full)",
            background: "var(--color-blue-400)",
            color: "var(--color-gray-50)",
            fontSize: "var(--text-xs)",
          }}
        >
          {grade}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>{email}</p>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
        누적 주문 <strong style={{ color: "var(--color-blue-900)" }}>{orderCount.toLocaleString("ko-KR")}</strong>건
      </p>
    </div>
  );
}
