import { Button } from "./Button";

interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  // 첫 페이지, 마지막 페이지, 현재 페이지, 양옆 형제, 말줄임 2개
  if (totalPages <= siblingCount * 2 + 5) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const items: Item[] = [1];

  if (left > 2) items.push("ellipsis-start");
  items.push(...range(left, right));
  if (right < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = buildItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        이전
      </Button>

      {items.map((item) =>
        typeof item === "number" ? (
          <Button
            key={item}
            type="button"
            variant={item === current ? "primary" : "secondary"}
            size="sm"
            aria-current={item === current ? "page" : undefined}
            onClick={() => onPageChange(item)}
            className="min-w-[32px]"
          >
            {item}
          </Button>
        ) : (
          <span key={item} aria-hidden="true" className="px-1 text-sm text-gray-500">
            …
          </span>
        ),
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={current === totalPages}
        onClick={() => onPageChange(current + 1)}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        다음
      </Button>
    </nav>
  );
}
