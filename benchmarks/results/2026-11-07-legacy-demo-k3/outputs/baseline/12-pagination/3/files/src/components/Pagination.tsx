import clsx from "clsx";

interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblingCount?: number;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const first = 1;
  const last = totalPages;
  const start = Math.max(first + 1, page - siblingCount);
  const end = Math.min(last - 1, page + siblingCount);

  const items: Item[] = [first];
  if (start > first + 1) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < last - 1) items.push("ellipsis-end");
  if (last > first) items.push(last);
  return items;
}

const baseButton = "rounded-lg px-3 py-1 text-sm font-medium border";

export function Pagination({ page, totalPages, onChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = buildItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(current - 1)}
        disabled={current === 1}
        className={clsx(
          baseButton,
          "bg-white text-gray-900 border-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-100",
        )}
      >
        이전
      </button>

      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === current ? "page" : undefined}
            className={clsx(
              baseButton,
              item === current
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-700 border-gray-300",
            )}
          >
            {item}
          </button>
        ) : (
          <span key={item} aria-hidden="true" className="px-2 text-sm text-gray-500">
            …
          </span>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(current + 1)}
        disabled={current === totalPages}
        className={clsx(
          baseButton,
          "bg-white text-gray-900 border-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:bg-gray-100",
        )}
      >
        다음
      </button>
    </nav>
  );
}
