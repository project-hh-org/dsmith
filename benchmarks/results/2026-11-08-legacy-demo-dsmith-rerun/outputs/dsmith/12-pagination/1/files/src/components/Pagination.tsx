import clsx from "clsx";
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

type Item = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number) {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  // 처음 + 끝 + 현재 + 양옆 + 말줄임 2개
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;

  if (!showStartEllipsis) {
    return [...range(1, siblingCount * 2 + 3), "ellipsis-end", totalPages];
  }
  if (!showEndEllipsis) {
    return [1, "ellipsis-start", ...range(totalPages - (siblingCount * 2 + 2), totalPages)];
  }
  return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", totalPages];
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages < 1) return null;

  const items = getItems(page, totalPages, siblingCount);
  const go = (next: number) => onPageChange(Math.min(Math.max(next, 1), totalPages));

  return (
    <nav aria-label="페이지네이션" className={clsx("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
      >
        이전
      </Button>

      {items.map((item) =>
        typeof item === "number" ? (
          <Button
            key={item}
            variant={item === page ? "default" : "ghost"}
            size="sm"
            onClick={() => go(item)}
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item}페이지`}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-xs">
            …
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
      >
        다음
      </Button>
    </nav>
  );
}
