import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 보여 준다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onResetFilters: () => void;
  /** 기본 검색 아이콘 대신 쓸 아이콘 */
  icon?: ReactNode;
  title?: string;
  description?: string;
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
  onResetFilters,
  icon,
  title = "검색 결과가 없습니다",
  description,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `“${query}”에 해당하는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.");

  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-ds-5 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-gray-50 text-ds-gray-500">
        {icon ?? <SearchIcon />}
      </div>
      <p className="mt-ds-4 text-ds-xl font-semibold text-ds-blue-900">{title}</p>
      <p className="mt-ds-2 text-ds-xs text-ds-gray-500">{message}</p>
      <div className="mt-ds-5">
        <Button variant="outline" onClick={onResetFilters}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
