interface PaginationProps {
  page: number; // 1부터 시작
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function getPageItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  const first = 1;
  const last = totalPages;
  const start = Math.max(first + 1, page - siblingCount);
  const end = Math.min(last - 1, page + siblingCount);

  const items: PageItem[] = [first];
  if (start > first + 1) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < last - 1) items.push("ellipsis-end");
  if (last > first) items.push(last);
  return items;
}

const base = "rounded-lg px-3 py-1 text-sm font-medium border";
const idle = "bg-white text-gray-900 border-gray-300";
const active = "bg-[var(--color-blue-400)] text-white border-[var(--color-blue-400)]";
const disabledCls = "disabled:opacity-50 disabled:cursor-not-allowed";

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages < 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getPageItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지네이션" className="flex items-center gap-1">
      <button
        type="button"
        className={`${base} ${idle} ${disabledCls}`}
        disabled={current <= 1}
        onClick={() => onPageChange(current - 1)}
      >
        이전
      </button>
      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-current={item === current ? "page" : undefined}
            className={`${base} ${item === current ? active : idle}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-2 text-sm text-gray-500" aria-hidden="true">
            …
          </span>
        )
      )}
      <button
        type="button"
        className={`${base} ${idle} ${disabledCls}`}
        disabled={current >= totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}
