interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 고객 요약 카드. 색·간격·모서리·글꼴 크기는 DS 토큰(ds- 클래스)만 사용한다.
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  return (
    <div className="rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4">
      <div className="flex items-start justify-between gap-ds-3">
        <div>
          <p className="text-ds-xl font-bold text-ds-blue-900">{name}</p>
          <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{email}</p>
        </div>
        <span className="rounded-ds-full bg-ds-blue-400 px-ds-3 py-ds-2 text-ds-xs text-ds-gray-50">
          {grade}
        </span>
      </div>
      <dl className="mt-ds-4 flex items-center justify-between border-t border-ds-gray-100 pt-ds-3">
        <dt className="text-ds-xs text-ds-gray-500">누적 주문 수</dt>
        <dd className="text-ds-xs font-bold text-ds-blue-900">{orderCount.toLocaleString("ko-KR")}건</dd>
      </dl>
    </div>
  );
}
