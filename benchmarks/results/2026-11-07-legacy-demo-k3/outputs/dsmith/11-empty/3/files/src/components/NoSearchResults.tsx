import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
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
  title = "검색 결과가 없습니다",
  description = "검색어를 바꾸거나 필터를 초기화해 보세요.",
  resetLabel = "필터 초기화",
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
          <path d="m20 20-3.5-3.5" />
        </svg>
      </div>
      <p className="mt-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        {title}
      </p>
      {query && (
        <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
          “{query}”에 대한 결과를 찾지 못했습니다.
        </p>
      )}
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {description}
      </p>
      <div className="mt-[var(--space-4)]">
        <Button variant="outline" onClick={onResetFilters}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
