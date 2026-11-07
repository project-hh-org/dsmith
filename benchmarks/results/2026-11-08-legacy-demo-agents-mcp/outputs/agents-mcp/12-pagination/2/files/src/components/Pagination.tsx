import clsx from "clsx";
import { Button } from "./ui/button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
  className?: string;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function getItems(page: number, pageCount: number, siblings: number): Item[] {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

  // 처음 + 끝 + 현재 + 양옆 + 말줄임 2개가 다 들어가는 크기
  const total = siblings * 2 + 5;
  if (pageCount <= total) return range(1, pageCount);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, pageCount);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < pageCount - 1;
  const edgeCount = siblings * 2 + 3;

  if (!showStartEllipsis) return [...range(1, edgeCount), "ellipsis-end", pageCount];
  if (!showEndEllipsis) return [1, "ellipsis-start", ...range(pageCount - edgeCount + 1, pageCount)];
  return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", pageCount];
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const items = getItems(page, pageCount, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={clsx("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>

      {items.map((item) =>
        typeof item === "number" ? (
          <Button
            key={item}
            variant={item === page ? "default" : "ghost"}
            size="sm"
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item}페이지`}
            className="min-w-8"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-xs text-gray-500">
            …
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
