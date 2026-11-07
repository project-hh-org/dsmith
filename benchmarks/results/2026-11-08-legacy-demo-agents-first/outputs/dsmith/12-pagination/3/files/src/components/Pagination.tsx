import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여 줄 페이지 수 */
  siblingCount?: number;
  className?: string;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getPageItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  // 처음 + 끝 + 현재 + 양옆 + 말줄임표 2개
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;
  const edgeCount = siblingCount * 2 + 3;

  if (!showStartEllipsis) {
    return [...range(1, edgeCount), "ellipsis-end", totalPages];
  }
  if (!showEndEllipsis) {
    return [1, "ellipsis-start", ...range(totalPages - edgeCount + 1, totalPages)];
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

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getPageItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={className}>
      <ul className="flex items-center gap-[var(--space-2)]">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            이전
          </Button>
        </li>
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === current ? "default" : "ghost"}
                size="sm"
                aria-current={item === current ? "page" : undefined}
                aria-label={`${item}페이지`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-[var(--space-2)] text-[var(--color-gray-500)]">
              …
            </li>
          ),
        )}
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
