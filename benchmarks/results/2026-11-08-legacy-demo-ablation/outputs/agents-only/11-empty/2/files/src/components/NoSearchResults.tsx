import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 함께 표시한다. */
  query?: string;
  onResetFilters: () => void;
  title?: string;
  description?: string;
  resetLabel?: string;
  className?: string;
}

export function NoSearchResults({
  query,
  onResetFilters,
  title = "검색 결과가 없어요",
  description,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 필터를 초기화해 보세요.");

  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-ds-5 text-center", className)}
    >
      <div className="flex items-center justify-center rounded-ds-full bg-ds-gray-50 p-ds-4 text-ds-gray-500">
        <svg
          aria-hidden="true"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
        </svg>
      </div>
      <p className="mt-ds-3 text-ds-xl font-semibold text-ds-blue-900">{title}</p>
      <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{message}</p>
      <Button variant="outline" size="md" className="mt-ds-4" onClick={onResetFilters}>
        {resetLabel}
      </Button>
    </div>
  );
}
