import clsx from "clsx";

interface PaginationProps {
  page: number; // 현재 페이지 (1부터 시작)
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // 현재 페이지 양옆에 보여줄 번호 수
  className?: string;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);
}

// 첫/끝 페이지는 항상 노출하고, 현재 페이지 주변만 펼친 뒤 나머지는 … 으로 줄임
function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const showStartEllipsis = left > 2;
  const showEndEllipsis = right < totalPages - 1;

  if (!showStartEllipsis) {
    return [...range(1, siblingCount * 2 + 3), "ellipsis-end", totalPages];
  }
  if (!showEndEllipsis) {
    return [1, "ellipsis-start", ...range(totalPages - (siblingCount * 2 + 2), totalPages)];
  }
  return [1, "ellipsis-start", ...range(left, right), "ellipsis-end", totalPages];
}

const itemBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-3 text-sm transition-colors";

export function Pagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);
  const isFirst = current === 1;
  const isLast = current === totalPages;

  return (
    <nav aria-label="페이지 이동" className={clsx("flex items-center justify-center gap-1", className)}>
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={isFirst}
        className={clsx(
          itemBase,
          "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
          "disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white",
        )}
      >
        이전
      </button>

      {items.map((item) =>
        typeof item === "string" ? (
          <span key={item} aria-hidden="true" className="px-1 text-sm text-gray-500">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-label={`${item}페이지`}
            aria-current={item === current ? "page" : undefined}
            className={clsx(
              itemBase,
              item === current
                ? "bg-brand font-semibold text-white"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={isLast}
        className={clsx(
          itemBase,
          "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
          "disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white",
        )}
      >
        다음
      </button>
    </nav>
  );
}
