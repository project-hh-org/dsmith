import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  title?: string;
  description?: string;
  /** 검색어. 있으면 안내 문구에 함께 보여 줍니다. */
  query?: string;
  /** 기본 검색 아이콘을 바꾸고 싶을 때 */
  icon?: ReactNode;
  onResetFilters: () => void;
  resetLabel?: string;
  className?: string;
}

function SearchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function NoSearchResults({
  title = "검색 결과가 없어요",
  description = "검색어를 바꾸거나 필터를 초기화해 보세요.",
  query,
  icon,
  onResetFilters,
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
      <div className="mb-[var(--space-4)] flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-50)] text-[var(--color-gray-500)]">
        {icon ?? <SearchIcon />}
      </div>
      <p className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
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
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
