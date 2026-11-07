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

function getItems(page: number, totalPages: number, siblings: number): Item[] {
  const range = (from: number, to: number) =>
    Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

  // 처음 + 끝 + 현재 + 양옆 + 말줄임 2개가 다 들어갈 수 있으면 전부 표시
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
    <nav
      aria-label="페이지네이션"
      className={`flex items-center gap-ds-2 text-ds-xs ${className ?? ""}`}
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
            aria-label={`${item}페이지`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden className="px-ds-2 text-ds-gray-500">
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
