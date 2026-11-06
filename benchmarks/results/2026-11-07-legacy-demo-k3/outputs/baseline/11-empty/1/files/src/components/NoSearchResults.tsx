import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  onResetFilters: () => void;
  title?: string;
  description?: string;
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
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
      ? `"${query}"에 해당하는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div className={clsx("flex flex-col items-center", className)} role="status">
      <div className="mt-12 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <SearchIcon />
      </div>
      <EmptyState
        title={title}
        description={message}
        className="pt-4"
        action={
          <Button variant="secondary" onClick={onResetFilters}>
            필터 초기화
          </Button>
        }
      />
    </div>
  );
}
