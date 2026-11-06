import clsx from "clsx";

interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  // 처음·끝·현재·양옆·말줄임 2개가 모두 들어갈 만큼 작으면 전부 표시
  if (totalPages <= siblingCount * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const items: PageItem[] = [1];

  if (left > 2) items.push("ellipsis-start");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < totalPages - 1) items.push("ellipsis-end");

  items.push(totalPages);
  return items;
}

const itemBase =
  "min-w-[32px] rounded-lg px-2 py-1 text-sm font-medium border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand";

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getPageItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className={clsx(
          itemBase,
          "bg-white text-gray-900 border-gray-300 px-3 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-50",
        )}
      >
        이전
      </button>

      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === current ? "page" : undefined}
            className={clsx(
              itemBase,
              item === current
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50",
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="min-w-[32px] px-2 py-1 text-center text-sm text-gray-500">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        className={clsx(
          itemBase,
          "bg-white text-gray-900 border-gray-300 px-3 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-50",
        )}
      >
        다음
      </button>
    </nav>
  );
}
