import type { CSSProperties } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  query?: string;
  title?: string;
  description?: string;
  resetLabel?: string;
  onResetFilters?: () => void;
  className?: string;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "var(--space-5)",
  gap: "var(--space-3)",
};

const iconWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "calc(var(--space-5) * 3)",
  height: "calc(var(--space-5) * 3)",
  borderRadius: "var(--radius-full)",
  background: "var(--color-gray-50)",
  color: "var(--color-gray-500)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
  color: "var(--color-blue-900)",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

export function NoSearchResults({
  query,
  title = "검색 결과가 없어요",
  description,
  resetLabel = "필터 초기화",
  onResetFilters,
  className,
}: NoSearchResultsProps) {
  const message =
    description ??
    (query
      ? `“${query}”에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어나 필터를 바꿔 보세요.");

  return (
    <div role="status" className={className} style={containerStyle}>
      <div style={iconWrapStyle} aria-hidden="true">
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <p style={titleStyle}>{title}</p>
      <p style={descriptionStyle}>{message}</p>
      {onResetFilters && (
        <Button variant="outline" onClick={onResetFilters}>
          {resetLabel}
        </Button>
      )}
    </div>
  );
}
