import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function getItems(page: number, total: number, sibling: number): Item[] {
  const start = Math.max(2, page - sibling);
  const end = Math.min(total - 1, page + sibling);
  const items: Item[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("ellipsis-end");
  if (total > 1) items.push(total);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages < 1) return null;
  const items = getItems(page, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className="flex items-center gap-[var(--space-2)]">
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
            variant={item === page ? "default" : "outline"}
            size="sm"
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item}페이지`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden="true" className="px-[var(--space-2)] text-[var(--color-gray-500)]">
            …
          </span>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
