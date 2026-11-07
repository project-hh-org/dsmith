interface PaginationProps {
  page: number; // 현재 페이지 (1부터 시작)
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // 현재 페이지 양옆에 보여줄 페이지 수
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblingCount: number): PageItem[] {
  const start = Math.max(2, page - siblingCount);
  const end = Math.min(totalPages - 1, page + siblingCount);

  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis-end");
  if (totalPages > 1) items.push(totalPages);
  return items;
}

const baseButton = "rounded-lg border px-3 py-1 text-sm font-medium";

export function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = buildItems(current, totalPages, siblingCount);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className={`${baseButton} border-gray-300 bg-white text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400`}
      >
        이전
      </button>

      {items.map((item) =>
        typeof item === "string" ? (
          <span key={item} className="px-2 text-sm text-gray-500" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === current ? "page" : undefined}
            className={`${baseButton} ${
              item === current
                ? "border-[#3B82F6] bg-[#3B82F6] text-white"
                : "border-gray-300 bg-white text-gray-900"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        className={`${baseButton} border-gray-300 bg-white text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400`}
      >
        다음
      </button>
    </nav>
  );
}
