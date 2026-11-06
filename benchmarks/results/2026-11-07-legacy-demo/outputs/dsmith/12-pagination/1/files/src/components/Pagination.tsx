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

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  // 첫/끝 페이지 + 현재 구간 + 생략 부호 2개까지 한 번에 보이는 최대 개수
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const showStart = left > 2;
  const showEnd = right < totalPages - 1;
  const edgeCount = siblingCount * 2 + 3;

  if (!showStart) return [...range(1, edgeCount), "ellipsis-end", totalPages];
  if (!showEnd) return [1, "ellipsis-start", ...range(totalPages - edgeCount + 1, totalPages)];
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

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={clsx("flex items-center gap-1", className)}>
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
            aria-label={`${item}페이지`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden className="px-2 text-gray-500">
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
