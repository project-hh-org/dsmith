import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 표시한다. */
  query?: string;
  title?: string;
  description?: string;
  /** 기본 돋보기 아이콘 대신 쓸 아이콘 */
  icon?: ReactNode;
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
  title = "검색 결과가 없어요",
  description,
  icon,
  onResetFilters,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `‘${query}’에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.");

  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center text-center", className)}
      style={{ padding: "var(--space-5) var(--space-4)", gap: "var(--space-3)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center"
        style={{
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-50)",
          color: "var(--color-gray-500)",
        }}
      >
        {icon ?? <SearchIcon />}
      </div>
      <p
        className="font-semibold"
        style={{ fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}
      >
        {title}
      </p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>{message}</p>
      {onResetFilters && (
        <div style={{ marginTop: "var(--space-2)" }}>
          <Button variant="outline" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
