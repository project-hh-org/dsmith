import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  title?: string;
  description?: string;
  /** 검색어. 있으면 안내 문구에 함께 표시한다. */
  query?: string;
  /** 아이콘 자리. 기본은 돋보기 아이콘. */
  icon?: ReactNode;
  resetLabel?: string;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 그리지 않는다. */
  onReset?: () => void;
  className?: string;
}

function SearchIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
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
  title = "검색 결과가 없습니다",
  description,
  query,
  icon,
  resetLabel = "필터 초기화",
  onReset,
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `'${query}'에 대한 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "검색어나 필터를 바꿔 다시 시도해 보세요.");

  return (
    <div
      role="status"
      className={clsx(
        "flex flex-col items-center py-12 text-center",
        className,
      )}
    >
      <div className="text-[var(--color-gray-500)]">{icon ?? <SearchIcon />}</div>
      <p className="mt-4 text-base font-semibold text-[var(--color-blue-900)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-gray-500)]">{message}</p>
      {onReset && (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
