import clsx from "clsx";

interface PaginationProps {
  page: number; // 현재 페이지 (1부터 시작)
  totalPages: number;
  onChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblings?: number;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblings: number): Item[] {
  // 처음 + 끝 + 현재 + 양옆 + 말줄임 2개가 들어갈 만큼 적으면 전부 표시
  if (totalPages <= siblings * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const start = Math.max(2, page - siblings);
  const end = Math.min(totalPages - 1, page + siblings);
  const items: Item[] = [1];
  if (start > 2) items.push("ellipsis-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

const base = "rounded-lg border px-3 py-1 text-sm font-medium";
const idle = "bg-white text-gray-900 border-gray-300";
const disabledCls = "opacity-50 cursor-not-allowed";

export function Pagination({ page, totalPages, onChange, siblings = 1 }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);

  return (
    <nav aria-label="페이지 이동" className="flex items-center justify-center gap-1">
      <button
        type="button"
        className={clsx(base, idle, current === 1 && disabledCls)}
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
      >
        이전
      </button>

      {buildItems(current, totalPages, siblings).map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-current={item === current ? "page" : undefined}
            className={clsx(
              base,
              item === current ? "bg-[#3B82F6] text-white border-[#3B82F6]" : idle,
            )}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="px-2 text-sm text-gray-500" aria-hidden="true">
            …
          </span>
        ),
      )}

      <button
        type="button"
        className={clsx(base, idle, current === totalPages && disabledCls)}
        disabled={current === totalPages}
        onClick={() => onChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}
