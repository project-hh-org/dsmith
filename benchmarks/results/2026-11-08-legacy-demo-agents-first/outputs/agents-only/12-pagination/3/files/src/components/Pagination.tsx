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

function range(from: number, to: number) {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

function getItems(page: number, total: number, sibling: number): Item[] {
  // 처음 + 끝 + 현재 + 양옆 + 줄임표 2개
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
    <nav aria-label="페이지네이션" className={className}>
      <ul className="flex items-center gap-ds-2">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            aria-label="이전 페이지"
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
                className={clsx("min-w-8", item === current && "font-bold")}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-ds-2 text-ds-xs text-ds-gray-500">
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
            aria-label="다음 페이지"
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
