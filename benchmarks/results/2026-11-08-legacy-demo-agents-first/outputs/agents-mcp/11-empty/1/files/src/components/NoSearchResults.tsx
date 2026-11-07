import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  title?: string;
  description?: string;
  onResetFilters: () => void;
  resetLabel?: string;
  className?: string;
}

export function NoSearchResults({
  title = "검색 결과가 없습니다",
  description = "검색어나 필터 조건을 바꿔 다시 시도해 보세요.",
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-ds-5 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-gray-100 text-ds-gray-500">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>
      <p className="mt-ds-4 text-ds-xl font-semibold text-ds-blue-900">{title}</p>
      <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{description}</p>
      <Button variant="outline" size="md" className="mt-ds-5" onClick={onResetFilters}>
        {resetLabel}
      </Button>
    </div>
  );
}
