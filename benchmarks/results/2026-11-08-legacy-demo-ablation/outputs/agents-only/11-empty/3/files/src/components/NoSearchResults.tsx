import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 표시합니다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러 */
  onResetFilters: () => void;
  /** 아이콘 자리. 없으면 기본 돋보기 아이콘을 씁니다. */
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
  title = "검색 결과가 없어요",
  description,
  resetLabel = "필터 초기화",
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `“${query}”에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 필터를 바꿔 보세요.");

  return (
    <div
      role="status"
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "var(--space-5)",
        gap: "var(--space-3)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "48px",
          height: "48px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-100)",
          color: "var(--color-gray-500)",
        }}
      >
        {icon ?? <SearchIcon />}
      </div>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--color-blue-900)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-xs)",
          color: "var(--color-gray-500)",
        }}
      >
        {message}
      </p>
      <div style={{ marginTop: "var(--space-2)" }}>
        <Button variant="outline" onClick={onResetFilters}>
          {resetLabel}
        </Button>
      </div>
    </div>
  );
}
