import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  query?: string;
  onResetFilters: () => void;
  title?: string;
  description?: string;
  className?: string;
}

function SearchOffIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="mb-4 h-10 w-10 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M8.5 8.5l5 5M13.5 8.5l-5 5" />
    </svg>
  );
}

export function NoSearchResults({
  query,
  onResetFilters,
  title = "검색 결과가 없습니다",
  description,
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 해당하는 결과를 찾지 못했습니다. 검색어나 필터를 바꿔 다시 시도해 주세요.`
      : "조건에 맞는 결과를 찾지 못했습니다. 필터를 바꿔 다시 시도해 주세요.");

  return (
    <div role="status" className="flex flex-col items-center">
      <SearchOffIcon />
      <EmptyState
        title={title}
        description={message}
        className={className ?? "py-0"}
        action={
          <Button type="button" variant="secondary" onClick={onResetFilters}>
            필터 초기화
          </Button>
        }
      />
    </div>
  );
}
