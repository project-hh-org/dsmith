interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  tier: string;
}

// 고객 요약 카드. 색·간격·모서리·글꼴 크기는 DS 토큰(ds- 클래스)만 사용한다.
// Badge는 아직 골격이라 쓰지 않고 등급 표시는 토큰 클래스로 직접 만든다.
export function CustomerSummaryCard({ name, email, orderCount, tier }: CustomerSummaryCardProps) {
  return (
    <div className="flex flex-col gap-ds-3 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4">
      <div className="flex items-start justify-between gap-ds-3">
        <div className="flex flex-col gap-ds-2">
          <p className="text-ds-xl font-bold text-ds-blue-900">{name}</p>
          <p className="text-ds-xs text-ds-gray-500">{email}</p>
        </div>
        <span className="rounded-ds-full bg-ds-blue-400 px-ds-3 py-ds-2 text-ds-xs font-medium text-ds-gray-50">
          {tier}
        </span>
      </div>
      <p className="text-ds-xs text-ds-gray-500">
        누적 주문 <span className="font-bold text-ds-blue-900">{orderCount.toLocaleString("ko-KR")}</span>건
      </p>
    </div>
  );
}
