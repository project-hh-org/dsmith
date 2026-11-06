import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  title?: string;
  description?: string;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 숨깁니다. */
  onResetFilters?: () => void;
  resetLabel?: string;
  className?: string;
}

export function NoSearchResults({
  query,
  title = "검색 결과가 없습니다",
  description,
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `"${query}"에 해당하는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.");

  return (
    <div className={clsx("flex flex-col items-center py-12 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>
      <p className="mt-4 text-base font-semibold text-gray-900">{title}</p>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {onResetFilters && (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
