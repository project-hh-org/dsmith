import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 표시합니다. */
  query?: string;
  title?: string;
  description?: string;
  resetLabel?: string;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 숨깁니다. */
  onResetFilters?: () => void;
  className?: string;
}

export function NoSearchResults({
  query,
  title = "검색 결과가 없습니다",
  description,
  resetLabel = "필터 초기화",
  onResetFilters,
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 대한 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-ds-5 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-gray-100 text-ds-gray-500">
        <svg
          aria-hidden="true"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>
      <p className="mt-ds-4 text-ds-xl font-semibold text-ds-blue-900">{title}</p>
      <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{message}</p>
      {onResetFilters && (
        <div className="mt-ds-4">
          <Button variant="outline" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
