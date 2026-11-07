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
  return Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);
}

function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  // 처음·끝·현재·양옆·생략 2칸을 모두 보여줄 수 있으면 전부 표시
  if (totalPages <= siblingCount * 2 + 5) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, totalPages);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;
  const span = siblingCount * 2 + 3;

  if (!showStartEllipsis) return [...range(1, span), "ellipsis-end", totalPages];
  if (!showEndEllipsis) return [1, "ellipsis-start", ...range(totalPages - span + 1, totalPages)];
  return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", totalPages];
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages < 1) return null;

  const go = (next: number) => onPageChange(Math.min(Math.max(next, 1), totalPages));

  return (
    <nav
      aria-label="페이지 이동"
      className={clsx("flex items-center gap-[var(--space-2)]", className)}
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
        className="disabled:opacity-50"
      >
        이전
      </Button>

      <ul className="flex items-center gap-[var(--space-2)]">
        {getItems(page, totalPages, siblingCount).map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <Button
                variant={item === page ? "default" : "ghost"}
                size="sm"
                aria-current={item === page ? "page" : undefined}
                aria-label={`${item}페이지`}
                onClick={() => go(item)}
                className="min-w-8"
              >
                {item}
              </Button>
            </li>
          ) : (
            <li
              key={item}
              aria-hidden="true"
              className="px-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]"
            >
              …
            </li>
          ),
        )}
      </ul>

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
        className="disabled:opacity-50"
      >
        다음
      </Button>
    </nav>
  );
}
