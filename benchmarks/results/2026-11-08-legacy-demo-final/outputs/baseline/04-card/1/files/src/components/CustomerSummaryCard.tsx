import { Badge } from "@/components/Badge";

interface CustomerSummaryCardProps {
  name: string;
  email: string;
  orderCount: number;
  grade: string;
}

// 고객 요약 카드. 등급 색은 고객 목록(app/customers/page.tsx)과 동일하게 맞춤
export function CustomerSummaryCard({ name, email, orderCount, grade }: CustomerSummaryCardProps) {
  const gradeColor = grade === "VIP" ? "blue" : grade === "휴면" ? "red" : "gray";

  return (
    <div className="min-w-[240px] rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-bold text-gray-900">{name}</p>
        <Badge color={gradeColor}>{grade}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-500">{email}</p>
      <p className="mt-4 text-sm text-gray-500">누적 주문</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{orderCount.toLocaleString("ko-KR")}건</p>
    </div>
  );
}
