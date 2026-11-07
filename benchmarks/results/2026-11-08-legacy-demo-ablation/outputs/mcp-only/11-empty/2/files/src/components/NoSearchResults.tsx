import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  title?: string;
  description?: string;
  onResetFilters: () => void;
  resetLabel?: string;
  className?: string;
}

export function NoSearchResults({
  query,
  title = "검색 결과가 없습니다",
  description = "검색어를 바꾸거나 적용된 필터를 초기화해 보세요.",
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-12 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
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
      <p className="mt-4 text-base font-semibold text-gray-900">{title}</p>
      {query && (
        <p className="mt-1 text-sm text-gray-900">&lsquo;{query}&rsquo;에 대한 결과를 찾지 못했어요.</p>
      )}
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-6">
        <Button variant="outline" onClick={onResetFilters}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
