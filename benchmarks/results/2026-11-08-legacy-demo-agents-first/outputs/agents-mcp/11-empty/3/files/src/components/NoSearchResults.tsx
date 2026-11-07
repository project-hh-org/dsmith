import clsx from "clsx";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 사용자가 입력한 검색어. 있으면 안내 문구에 표시한다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onResetFilters: () => void;
  className?: string;
}

export function NoSearchResults({ query, onResetFilters, className }: NoSearchResultsProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center text-center py-[var(--space-5)] px-[var(--space-4)]",
        className,
      )}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-gray-50)] text-[var(--color-gray-500)]"
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
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
        검색 결과가 없습니다
      </p>
      <p className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        {query ? `'${query}'에 해당하는 결과를 찾지 못했어요. ` : ""}
        검색어를 바꾸거나 필터를 초기화해 보세요.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-[var(--space-4)]"
        onClick={onResetFilters}
      >
        필터 초기화
      </Button>
    </div>
  );
}
