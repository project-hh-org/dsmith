import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 보여준다. */
  query?: string;
  /** 아이콘 자리. 없으면 기본 돋보기 아이콘을 쓴다. */
  icon?: ReactNode;
  title?: string;
  description?: string;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 그리지 않는다. */
  onResetFilters?: () => void;
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
  icon,
  title = "검색 결과가 없습니다",
  description,
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center py-12 px-ds-4 text-center", className)}
    >
      <div className="mb-ds-4 flex h-12 w-12 items-center justify-center rounded-ds-full bg-ds-gray-100 text-ds-gray-500">
        {icon ?? <SearchIcon />}
      </div>
      <p className="text-ds-xl font-semibold text-ds-blue-900">{title}</p>
      <p className="mt-ds-2 max-w-sm text-ds-xs text-ds-gray-500">{message}</p>
      {onResetFilters && (
        <div className="mt-ds-5">
          <Button variant="outline" size="md" type="button" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
