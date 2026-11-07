import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 보여줍니다. */
  query?: string;
  title?: string;
  description?: string;
  /** 아이콘 자리. 없으면 기본 돋보기 아이콘을 씁니다. */
  icon?: ReactNode;
  /** 필터 초기화 버튼 클릭 핸들러. */
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
  query,
  title = "검색 결과가 없습니다",
  description,
  icon,
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 필터를 초기화해 보세요.");

  return (
    <div
      role="status"
      className={clsx(
        "flex flex-col items-center py-12 text-center",
        "gap-[var(--space-4)]",
        className,
      )}
    >
      <div
        className={clsx(
          "flex h-12 w-12 items-center justify-center",
          "rounded-[var(--radius-full)]",
          "bg-[var(--color-gray-50)] text-[var(--color-gray-500)]",
        )}
      >
        {icon ?? <SearchIcon />}
      </div>
      <div className="flex flex-col gap-[var(--space-2)]">
        <p className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">
          {title}
        </p>
        <p className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">{message}</p>
      </div>
      <Button variant="outline" size="md" type="button" onClick={onResetFilters}>
        {resetLabel}
      </Button>
    </div>
  );
}
