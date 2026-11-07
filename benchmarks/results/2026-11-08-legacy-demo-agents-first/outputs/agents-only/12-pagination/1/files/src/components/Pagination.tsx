import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 번호 수 */
  siblingCount?: number;
  className?: string;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const start = Math.max(2, page - siblingCount);
  const end = Math.min(totalPages - 1, page + siblingCount);
  const items: Item[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < totalPages - 1) items.push("ellipsis-end");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1, className }: PaginationProps) {
  if (totalPages < 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);

  return (
    <nav
      aria-label="페이지네이션"
      className={`flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] ${className ?? ""}`}
    >
      <Button
        variant="outline"
        size="sm"
        className="rounded-[var(--radius-sm)]"
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
            className="min-w-8 rounded-[var(--radius-sm)]"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden className="px-[var(--space-2)] text-[color:var(--color-gray-500)]">
            …
          </span>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        className="rounded-[var(--radius-sm)]"
        disabled={current >= totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
