interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblings?: number;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblings: number): Item[] {
  // 처음 + 끝 + 현재 + 양옆 + 말줄임 2개가 들어갈 만큼 적으면 전부 보여줌
  if (totalPages <= siblings * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, Math.min(page - siblings, totalPages - siblings * 2 - 1));
  const end = Math.min(totalPages - 1, Math.max(page + siblings, siblings * 2 + 2));

  const items: Item[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

const base = "min-w-[32px] rounded-lg px-2 py-1 text-sm font-medium";
const idle = "bg-white text-gray-900 border border-gray-300";
const disabledStyle = "disabled:cursor-not-allowed disabled:text-gray-500 disabled:bg-[#F9FAFB]";

export function Pagination({ page, totalPages, onPageChange, siblings = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = buildItems(current, totalPages, siblings);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <button
        type="button"
        className={`${base} ${idle} ${disabledStyle}`}
        disabled={current === 1}
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
            className={`${base} ${item === current ? "bg-brand text-white" : idle}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-1 text-sm text-gray-500" aria-hidden="true">
            …
          </span>
        )
      )}

      <button
        type="button"
        className={`${base} ${idle} ${disabledStyle}`}
        disabled={current === totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}
