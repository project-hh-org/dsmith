import type { CSSProperties, ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 표시한다. */
  query?: string;
  title?: string;
  description?: string;
  /** 아이콘 자리. 없으면 기본 돋보기 아이콘을 보여준다. */
  icon?: ReactNode;
  /** 필터 초기화 버튼 클릭 핸들러. 없으면 버튼을 숨긴다. */
  onResetFilters?: () => void;
  resetLabel?: string;
  className?: string;
}

const styles: Record<string, CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "var(--space-5) var(--space-4)",
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "var(--space-5)",
    height: "var(--space-5)",
    boxSizing: "content-box",
    padding: "var(--space-3)",
    borderRadius: "var(--radius-full)",
    background: "var(--color-gray-50)",
    color: "var(--color-gray-500)",
  },
  title: {
    margin: "var(--space-4) 0 0",
    fontSize: "var(--text-xl)",
    fontWeight: 600,
    color: "var(--color-blue-900)",
  },
  description: {
    margin: "var(--space-2) 0 0",
    fontSize: "var(--text-xs)",
    color: "var(--color-gray-500)",
  },
  action: {
    marginTop: "var(--space-4)",
  },
};

function SearchIcon() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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
      ? `"${query}"에 대한 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.`
      : "조건에 맞는 결과를 찾지 못했어요. 검색어를 바꾸거나 필터를 초기화해 보세요.");

  return (
    <div role="status" className={className} style={styles.root}>
      <div style={styles.icon}>{icon ?? <SearchIcon />}</div>
      <p style={styles.title}>{title}</p>
      <p style={styles.description}>{message}</p>
      {onResetFilters && (
        <div style={styles.action}>
          <Button variant="outline" size="md" onClick={onResetFilters}>
            {resetLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
