import clsx from "clsx";
import { Button } from "./Button";

interface NoSearchResultsProps {
  query?: string;
  onResetFilters: () => void;
  className?: string;
}

export function NoSearchResults({ query, onResetFilters, className }: NoSearchResultsProps) {
  return (
    <div className={clsx("flex flex-col items-center py-12 text-center", className)}>
      <svg
        aria-hidden="true"
        className="mb-4 h-10 w-10 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5M8.5 8.5l5 5m0-5-5 5" />
      </svg>
      <p className="text-base font-semibold text-gray-900">
        {query ? `'${query}'에 대한 검색 결과가 없습니다` : "검색 결과가 없습니다"}
      </p>
      <p className="mt-2 text-sm text-gray-500">검색어를 바꾸거나 적용된 필터를 초기화해 보세요.</p>
      <div className="mt-6">
        <Button variant="secondary" onClick={onResetFilters}>
          필터 초기화
        </Button>
      </div>
    </div>
  );
}
