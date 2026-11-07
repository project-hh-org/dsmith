import { Badge } from "@/components/Badge";

export type CustomerGrade = "VIP" | "일반" | "휴면";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: CustomerGrade;
}

const gradeColor = {
  VIP: "blue",
  일반: "gray",
  휴면: "red",
} as const;

// 고객 요약 카드. 색·간격·반경은 design-system/tokens.css 변수를 사용
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="min-w-[240px] border border-[var(--color-gray-100)] bg-white p-[var(--space-4)] rounded-lg">
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="min-w-0">
          <p className="truncate text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">{name}</p>
          <p className="mt-1 truncate text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{email}</p>
        </div>
        <Badge color={gradeColor[grade]}>{grade}</Badge>
      </div>
      <dl className="mt-[var(--space-3)] flex items-center justify-between border-t border-[var(--color-gray-100)] pt-[var(--space-3)]">
        <dt className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">누적 주문</dt>
        <dd className="font-bold text-[var(--color-blue-900)]">{orderCount.toLocaleString("ko-KR")}건</dd>
      </dl>
    </div>
  );
}
