import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onResetFilters: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function NoSearchResults({
  query,
  onResetFilters,
  title = "검색 결과가 없습니다",
  description = "검색어를 바꾸거나 적용된 필터를 초기화해 보세요.",
  className,
}: NoSearchResultsProps) {
  return (
    <div
      role="status"
      className={clsx(
        "flex flex-col items-center py-[var(--space-5)] text-center",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-50)] text-[var(--color-gray-500)]"
      >
        <svg
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
          <path d="M21 21l-4.3-4.3" />
        </svg>
      </div>
      <p className="mt-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        {title}
      </p>
      {query && (
        <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
          “{query}”에 대한 결과를 찾지 못했어요.
        </p>
      )}
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {description}
      </p>
      <div className="mt-[var(--space-4)]">
        <Button variant="outline" onClick={onResetFilters}>
          필터 초기화
        </Button>
      </div>
    </div>
  );
}
