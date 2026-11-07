import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 표시합니다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onResetFilters: () => void;
  title?: string;
  description?: string;
  resetLabel?: string;
  className?: string;
}

function SearchOffIcon() {
  return (
    <span
      className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-50)] text-[var(--color-gray-500)]"
      aria-hidden="true"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
        <path d="m8.5 8.5 5 5" />
        <path d="m13.5 8.5-5 5" />
      </svg>
    </span>
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
      ? `"${query}"에 해당하는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div role="status" className={clsx("flex flex-col items-center", className)}>
      <div className="flex flex-col items-center pt-12">
        <SearchOffIcon />
      </div>
      <EmptyState
        title={title}
        description={message}
        className="!pt-0"
        action={
          <Button type="button" variant="secondary" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        }
      />
    </div>
  );
}
