interface PaginationProps {
  /** 현재 페이지 (1부터 시작) */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** 현재 페이지 양옆에 보여줄 페이지 수 */
  siblings?: number;
  className?: string;
}

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function buildItems(page: number, totalPages: number, siblings: number): PageItem[] {
  // 첫/끝 페이지 + 현재 주변 + 생략 표시 2칸까지 모두 들어갈 만큼 작으면 전부 표시
  if (totalPages <= siblings * 2 + 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const left = Math.max(page - siblings, 2);
  const right = Math.min(page + siblings, totalPages - 1);
  const items: PageItem[] = [1];

  if (left > 2) items.push("ellipsis-start");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < totalPages - 1) items.push("ellipsis-end");

  items.push(totalPages);
  return items;
}

const baseButton = "rounded-lg px-3 py-1 text-sm font-medium";
const idleButton = "bg-white text-gray-900 border border-gray-300";

export function Pagination({ page, totalPages, onPageChange, siblings = 1, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = buildItems(current, totalPages, siblings);

  return (
    <nav aria-label="페이지네이션" className={`flex items-center justify-center gap-1 ${className ?? ""}`}>
      <button
        type="button"
        className={`${baseButton} ${idleButton} disabled:cursor-not-allowed disabled:opacity-50`}
        disabled={current === 1}
        onClick={() => onPageChange(current - 1)}
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
            aria-current={item === current ? "page" : undefined}
            aria-label={`${item}페이지`}
            className={`${baseButton} ${item === current ? "bg-brand text-white border border-transparent" : idleButton}`}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className={`${baseButton} ${idleButton} disabled:cursor-not-allowed disabled:opacity-50`}
        disabled={current === totalPages}
        onClick={() => onPageChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}
