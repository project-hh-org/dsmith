interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

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
        gap: "var(--space-3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}>{name}</h3>
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
        누적 주문 <strong style={{ color: "var(--color-blue-900)" }}>{orderCount}</strong>건
      </p>
    </div>
  );
}
