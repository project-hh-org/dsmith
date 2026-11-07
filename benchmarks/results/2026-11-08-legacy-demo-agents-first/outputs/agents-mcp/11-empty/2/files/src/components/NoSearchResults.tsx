import clsx from "clsx";
import type { ReactNode } from "react";
import { Button } from "./ui/button";

interface NoSearchResultsProps {
  /** 검색어. 있으면 안내 문구에 함께 표시한다. */
  query?: string;
  /** 필터 초기화 버튼 클릭 핸들러. */
  onResetFilters: () => void;
  /** 기본 돋보기 아이콘 대신 쓸 아이콘. */
  icon?: ReactNode;
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

export function NoSearchResults({ query, onResetFilters, icon, className }: NoSearchResultsProps) {
  return (
    <div
      role="status"
      className={clsx("flex flex-col items-center text-center", className)}
      style={{ gap: "var(--space-3)", padding: "var(--space-5)" }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-full)",
          background: "var(--color-gray-50)",
          border: "1px solid var(--color-gray-100)",
          color: "var(--color-gray-500)",
        }}
      >
        {icon ?? <SearchIcon />}
      </div>
      <p
        className="font-semibold"
        style={{ fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}
      >
        검색 결과가 없습니다
      </p>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
        {query ? `'${query}'에 대한 결과를 찾을 수 없어요. ` : ""}
        검색어를 바꾸거나 필터를 초기화해 보세요.
      </p>
      <Button variant="outline" onClick={onResetFilters} style={{ marginTop: "var(--space-2)" }}>
        필터 초기화
      </Button>
    </div>
  );
}
