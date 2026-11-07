import type { CSSProperties } from "react";
import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
  className?: string;
}

const ELLIPSIS = "ellipsis" as const;
type Item = number | typeof ELLIPSIS;

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  // 처음·끝·현재 ± sibling·생략 기호 2개가 모두 들어갈 만큼 적으면 전부 보여준다.
  if (totalPages <= siblingCount * 2 + 5) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const items: Item[] = [1];

  if (left > 2) items.push(ELLIPSIS);
  items.push(...range(left, right));
  if (right < totalPages - 1) items.push(ELLIPSIS);
  items.push(totalPages);
  return items;
}

const listStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const ellipsisStyle: CSSProperties = {
  padding: "0 var(--space-2)",
  color: "var(--color-gray-500)",
  fontSize: "var(--text-xs)",
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages < 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);
  const go = (next: number) => {
    if (next >= 1 && next <= totalPages && next !== current) onPageChange(next);
  };

  return (
    <nav aria-label="페이지 이동" className={className}>
      <ul style={listStyle}>
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => go(current - 1)}
            aria-label="이전 페이지"
          >
            이전
          </Button>
        </li>
        {items.map((item, index) =>
          item === ELLIPSIS ? (
            <li key={`ellipsis-${index}`} aria-hidden="true" style={ellipsisStyle}>
              …
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={item === current ? "default" : "ghost"}
                size="sm"
                aria-label={`${item}페이지`}
                aria-current={item === current ? "page" : undefined}
                onClick={() => go(item)}
              >
                {item}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= totalPages}
            onClick={() => go(current + 1)}
            aria-label="다음 페이지"
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
