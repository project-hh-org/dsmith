import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  query?: string;
  title?: string;
  description?: string;
  onResetFilters: () => void;
  resetLabel?: string;
  className?: string;
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-10 w-10 text-gray-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
    </svg>
  );
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
      ? `"${query}"에 대한 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div role="status" className={clsx("flex flex-col items-center", className)}>
      <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <SearchIcon />
      </div>
      <EmptyState
        title={title}
        description={message}
        className="pt-4"
        action={
          <Button type="button" variant="secondary" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        }
      />
    </div>
  );
}
