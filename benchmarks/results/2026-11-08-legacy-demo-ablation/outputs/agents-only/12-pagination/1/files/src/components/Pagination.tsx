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
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);
}

function getItems(page: number, total: number, sibling: number): Item[] {
  // 처음·끝 + 현재 ± sibling + 말줄임 2칸
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

  const items = getItems(page, totalPages, siblingCount);

  return (
    <nav aria-label="페이지 이동" className={className}>
      <ul className="flex items-center gap-ds-2 text-ds-xs">
        <li>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
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
                aria-label={`${item}페이지`}
                aria-current={item === page ? "page" : undefined}
                className={clsx("min-w-8 rounded-ds-sm", item === page && "font-bold")}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} aria-hidden className="px-ds-2 text-ds-gray-500">
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
          >
            다음
          </Button>
        </li>
      </ul>
    </nav>
  );
}
