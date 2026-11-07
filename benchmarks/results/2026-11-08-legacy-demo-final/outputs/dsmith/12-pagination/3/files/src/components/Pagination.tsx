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

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages < 1) return null;
  const current = Math.min(Math.max(page, 1), totalPages);

  return (
    <nav aria-label="페이지네이션" className={className}>
      <ul className="flex items-center gap-2">
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
        {getItems(current, totalPages, siblingCount).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === current ? "default" : "ghost"}
                size="sm"
                aria-current={item === current ? "page" : undefined}
                aria-label={`${item}페이지`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true">
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
