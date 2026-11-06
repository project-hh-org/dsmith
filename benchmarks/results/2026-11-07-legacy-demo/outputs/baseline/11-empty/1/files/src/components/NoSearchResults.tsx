import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  query?: string;
  onResetFilters: () => void;
  title?: string;
  description?: string;
  resetLabel?: string;
  className?: string;
}

function SearchIcon() {
  return (
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
  );
}

export function NoSearchResults({
  query,
  onResetFilters,
  title = "검색 결과가 없습니다",
  description,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `"${query}"에 해당하는 결과를 찾지 못했습니다. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했습니다. 검색어나 필터를 바꿔 보세요.");

  return (
    <div role="status" className={clsx("flex flex-col items-center", className)}>
      <div className="mt-12 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <SearchIcon />
      </div>
      <EmptyState
        title={title}
        description={message}
        className="pt-4"
        action={
          <Button variant="secondary" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        }
      />
    </div>
  );
}
