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
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

  // 처음 + 끝 + 현재 구간 + 생략 2개가 다 들어가면 줄이지 않는다.
  if (total <= sibling * 2 + 5) return range(1, total);

  const left = Math.max(page - sibling, 2);
  const right = Math.min(page + sibling, total - 1);
  const items: Item[] = [1];

  if (left > 2) items.push("ellipsis-start");
  items.push(...range(left, right));
  if (right < total - 1) items.push("ellipsis-end");
  items.push(total);
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
            variant={item === page ? "default" : "ghost"}
            size="sm"
            aria-current={item === page ? "page" : undefined}
            aria-label={`${item}페이지`}
            className="min-w-8 text-[length:var(--text-xs)]"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="px-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]"
          >
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
