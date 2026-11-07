import { Badge } from "@/components/Badge";

export type MemberGrade = "bronze" | "silver" | "gold" | "vip";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: MemberGrade;
}

const GRADE_LABEL: Record<MemberGrade, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  vip: "VIP",
};

const GRADE_COLOR: Record<MemberGrade, "blue" | "gray" | "red"> = {
  bronze: "gray",
  silver: "gray",
  gold: "blue",
  vip: "red",
};

// 고객 요약 카드. 색·간격·반경은 design-system/tokens.css 변수를 사용한다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="min-w-[240px] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white p-[var(--space-4)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">{name}</p>
        <Badge color={GRADE_COLOR[grade]}>{GRADE_LABEL[grade]}</Badge>
      </div>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{email}</p>
      <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        누적 주문 <span className="font-bold text-[var(--color-blue-900)]">{orderCount.toLocaleString("ko-KR")}</span>건
      </p>
    </div>
  );
}
