import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  title?: string;
  description?: string;
  /** 아이콘 자리. 기본값은 돋보기 아이콘 */
  icon?: ReactNode;
  /** 필터 초기화 버튼 클릭 핸들러 */
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
  description = "검색어나 필터를 바꿔서 다시 시도해 보세요.",
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
      <div
        className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-100)] text-[var(--color-gray-500)]"
      >
        {icon ?? <SearchIcon />}
      </div>
      <p className="mt-[var(--space-4)] text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
        {title}
      </p>
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
