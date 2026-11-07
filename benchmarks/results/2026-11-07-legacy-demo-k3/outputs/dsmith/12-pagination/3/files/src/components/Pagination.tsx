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

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const first = 1;
  const last = totalPages;
  const start = Math.max(page - siblingCount, first + 1);
  const end = Math.min(page + siblingCount, last - 1);

  const items: Item[] = [first];
  if (start > first + 1) items.push("ellipsis-start");
  items.push(...range(start, end));
  if (end < last - 1) items.push("ellipsis-end");
  if (last > first) items.push(last);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages < 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className="flex items-center gap-1">
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
          <span key={item} aria-hidden className="px-2">
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
