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

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getPageItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  // 처음·끝·현재±sibling·말줄임 2개
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;

  const items: PageItem[] = [1];
  if (showStartEllipsis) items.push("ellipsis-start");
  else items.push(...range(2, left - 1));
  items.push(...range(left, right));
  if (showEndEllipsis) items.push("ellipsis-end");
  else items.push(...range(right + 1, totalPages - 1));
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

  const items = getPageItems(page, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className={className}>
      <ul className="flex items-center gap-1">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="이전 페이지"
          >
            이전
          </Button>
        </li>
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === page ? "default" : "ghost"}
                size="sm"
                aria-current={item === page ? "page" : undefined}
                aria-label={`${item}페이지`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="px-2 text-gray-500">
              …
            </li>
          ),
        )}
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="다음 페이지"
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
