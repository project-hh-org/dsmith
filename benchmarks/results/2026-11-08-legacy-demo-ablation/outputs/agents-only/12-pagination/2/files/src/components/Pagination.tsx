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
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  // 처음 + 끝 + 현재 + 양옆 + 생략 부호 2개
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

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages < 1) return null;

  const items = getItems(page, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={clsx("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>

      <ul className="flex items-center gap-2">
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === page ? "default" : "ghost"}
                size="sm"
                aria-current={item === page ? "page" : undefined}
                aria-label={`${item}페이지`}
                className={clsx("min-w-8", item === page && "font-bold")}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-1 text-gray-500">
              …
            </li>
          ),
        )}
      </ul>

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
