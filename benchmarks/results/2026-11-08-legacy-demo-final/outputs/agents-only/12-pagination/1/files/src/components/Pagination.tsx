import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 번호 개수 */
  siblingCount?: number;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function range(from: number, to: number) {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);
}

function getPageItems(page: number, totalPages: number, siblings: number): PageItem[] {
  // 처음 + 끝 + 현재 + 양옆 + 생략 표시 2개
  const maxVisible = siblings * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;

  const items: PageItem[] = [1];
  if (showStartEllipsis) items.push("ellipsis-start");
  else items.push(...range(2, left - 1));
  items.push(...range(left, right));
  if (showEndEllipsis) items.push("ellipsis-end");
  else items.push(...range(right + 1, totalPages - 1));
  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages < 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getPageItems(current, totalPages, siblingCount);

  return (
    <nav
      aria-label="페이지네이션"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-2)",
        fontSize: "var(--text-xs)",
      }}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        이전
      </Button>

      {items.map((item) =>
        typeof item === "number" ? (
          <Button
            key={item}
            variant={item === current ? "default" : "ghost"}
            size="sm"
            aria-current={item === current ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            style={{ color: "var(--color-gray-500)", padding: "0 var(--space-2)" }}
          >
            …
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={current >= totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
