import clsx from "clsx";

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

// 색상은 design-system/tokens.css 변수를 쓰고, 토큰 CSS가 로드되지 않은 경우를 위해 같은 값을 fallback 으로 둠.
// Badge 컴포넌트는 중복 정리(결정 대기) 중이라 의존하지 않고 카드 안에서 자체 pill 로 표시함.
export function CustomerSummaryCard({ name, email, orderCount, tier }: CustomerSummaryCardProps) {
  return (
    <div className="min-w-[240px] rounded-lg border border-[var(--color-gray-100,#e5e7eb)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-base font-bold text-[var(--color-blue-900,#111827)]">{name}</p>
        <span
          className={clsx(
            "inline-block shrink-0 rounded-full px-2 py-[3px] text-xs",
            tier === "vip"
              ? "bg-[var(--color-blue-400,#3b82f6)] text-white"
              : "bg-[var(--color-gray-50,#f9fafb)] text-[var(--color-gray-500,#6b7280)]",
          )}
        >
          {TIER_LABEL[tier]}
        </span>
      </div>
      <p className="mt-1 truncate text-sm text-[var(--color-gray-500,#6b7280)]">{email}</p>
      <p className="mt-3 text-sm text-[var(--color-gray-500,#6b7280)]">
        누적 주문{" "}
        <span className="font-bold text-[var(--color-blue-900,#111827)]">
          {orderCount.toLocaleString("ko-KR")}건
        </span>
      </p>
    </div>
  );
}
