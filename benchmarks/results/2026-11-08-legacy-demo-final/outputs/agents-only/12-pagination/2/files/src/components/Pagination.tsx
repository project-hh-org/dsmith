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

function getItems(page: number, totalPages: number, siblings: number): Item[] {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

  // 처음 + 끝 + 현재 + 양옆 + 생략 2개가 모두 들어가면 전부 보여준다
  if (totalPages <= siblings * 2 + 5) return range(1, totalPages);

  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, totalPages - 1);
  const items: Item[] = [1];
  if (left > 2) items.push("ellipsis-start");
  items.push(...range(left, right));
  if (right < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  const items = getItems(page, totalPages, siblingCount);

  return (
    <nav
      aria-label="페이지네이션"
      className="flex items-center"
      style={{ gap: "var(--space-2)", fontSize: "var(--text-xs)" }}
    >
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
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
