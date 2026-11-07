import clsx from "clsx";
import { Button } from "./ui/button";

export interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  /** 전체 페이지 수 */
  pageCount: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
  className?: string;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getItems(page: number, pageCount: number, siblingCount: number): Item[] {
  // 처음·마지막·현재·양옆·생략 기호 2개가 모두 들어갈 수 있으면 전부 표시
  if (pageCount <= siblingCount * 2 + 5) return range(1, pageCount);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, pageCount - 1);
  const items: Item[] = [1];

  if (left > 2) items.push("ellipsis-start");
  items.push(...range(left, right));
  if (right < pageCount - 1) items.push("ellipsis-end");
  items.push(pageCount);
  return items;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (pageCount < 1) return null;

  const current = Math.min(Math.max(page, 1), pageCount);
  const items = getItems(current, pageCount, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            aria-label="이전 페이지"
            className="disabled:opacity-50"
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
                onClick={() => onPageChange(item)}
                aria-label={`${item} 페이지`}
                aria-current={item === current ? "page" : undefined}
                className={clsx("min-w-8", item === current && "font-bold")}
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

        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= pageCount}
            onClick={() => onPageChange(current + 1)}
            aria-label="다음 페이지"
            className="disabled:opacity-50"
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
