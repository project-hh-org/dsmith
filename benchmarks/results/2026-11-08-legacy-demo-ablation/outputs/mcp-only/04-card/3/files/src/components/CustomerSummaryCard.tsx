import { Badge } from "@/components/Badge";

export type MembershipTier = "bronze" | "silver" | "gold" | "vip";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  tier: MembershipTier;
}

const TIER_LABEL: Record<MembershipTier, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  vip: "VIP",
};

const TIER_COLOR: Record<MembershipTier, "blue" | "gray" | "red"> = {
  bronze: "gray",
  silver: "gray",
  gold: "blue",
  vip: "red",
};

// 고객 요약 카드. 색/간격은 design-system/tokens.css 변수를 사용하고, 등급 뱃지는 공용 Badge를 재사용
export function CustomerSummaryCard({ name, email, orderCount, tier }: CustomerSummaryCardProps) {
  return (
    <div className="min-w-[240px] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white p-[var(--space-4)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <p className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">{name}</p>
        <Badge color={TIER_COLOR[tier]}>{TIER_LABEL[tier]}</Badge>
      </div>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{email}</p>
      <p className="mt-[var(--space-3)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        누적 주문{" "}
        <span className="font-bold text-[var(--color-blue-900)]">{orderCount.toLocaleString("ko-KR")}건</span>
      </p>
    </div>
  );
}
