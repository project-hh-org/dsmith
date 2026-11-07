import type { CSSProperties } from "react";

export interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  membershipTier: string;
  className?: string;
}

const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-3)",
  padding: "var(--space-5)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-blue-900)",
};

const name: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--color-blue-900)",
};

const email: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const stats: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
  margin: 0,
  paddingTop: "var(--space-3)",
  borderTop: "1px solid var(--color-gray-100)",
};

const label: CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const value: CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: "var(--color-blue-900)",
};

const tier: CSSProperties = {
  display: "inline-block",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-blue-400)",
  color: "var(--color-gray-50)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
};

export function CustomerSummaryCard({
  name: customerName,
  email: customerEmail,
  orderCount,
  membershipTier,
  className,
}: CustomerSummaryCardProps) {
  return (
    <section className={className} style={card}>
      <div>
        <h3 style={name}>{customerName}</h3>
        <p style={email}>{customerEmail}</p>
      </div>
      <dl style={stats}>
        <div>
          <dt style={label}>누적 주문 수</dt>
          <dd style={value}>{orderCount.toLocaleString()}건</dd>
        </div>
        <div>
          <dt style={label}>회원 등급</dt>
          <dd style={{ ...value, marginTop: "var(--space-2)" }}>
            <span style={tier}>{membershipTier}</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
