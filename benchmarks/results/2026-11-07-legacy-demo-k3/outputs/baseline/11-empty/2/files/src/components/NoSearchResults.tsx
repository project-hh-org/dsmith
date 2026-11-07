import clsx from "clsx";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 숨깁니다. */
  onResetFilters?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

function SearchOffIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
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
      ? `'${query}'에 해당하는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 다시 시도해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 다시 시도해 보세요.");

  return (
    <div role="status" className={clsx("flex flex-col items-center", className)}>
      <div className="mt-12 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <SearchOffIcon />
      </div>
      <EmptyState
        className="pt-4"
        title={title}
        description={message}
        action={
          onResetFilters && (
            <Button type="button" variant="secondary" onClick={onResetFilters}>
              필터 초기화
            </Button>
          )
        }
      />
    </div>
  );
}
