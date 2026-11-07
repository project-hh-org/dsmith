import clsx from "clsx";

interface PaginationProps {
  page: number; // 현재 페이지 (1부터 시작)
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number; // 현재 페이지 양옆에 보여줄 번호 수
  className?: string;
}

type Item = number | "ellipsis-start" | "ellipsis-end";

function range(from: number, to: number) {
  return Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);
}

// 첫/마지막 페이지는 항상 보이고, 현재 페이지 주변만 펼치고 나머지는 … 로 줄임
function getItems(page: number, totalPages: number, siblingCount: number): Item[] {
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) return range(1, totalPages);

  const left = Math.max(page - siblingCount, 2);
  const right = Math.min(page + siblingCount, totalPages - 1);
  const items: Item[] = [1];

  if (left > 2) items.push("ellipsis-start");
  items.push(...range(left, right));
  if (right < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
}

// 토큰(design-system/tokens.css)을 쓰되, 아직 전역에 import되지 않아 토큰 값을 fallback으로 둠
const itemBase =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-sm,4px)] px-2 text-xs transition-colors";
const itemIdle =
  "border border-[var(--color-gray-100,#e5e7eb)] bg-white text-[var(--color-blue-900,#111827)] hover:bg-[var(--color-gray-50,#f9fafb)]";
const itemActive =
  "border border-[var(--color-blue-400,#3b82f6)] bg-[var(--color-blue-400,#3b82f6)] font-semibold text-white";
const itemDisabled = "cursor-not-allowed opacity-50 hover:bg-white";

export function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const current = Math.min(Math.max(page, 1), totalPages);
  const items = getItems(current, totalPages, siblingCount);
  const isFirst = current === 1;
  const isLast = current === totalPages;

  return (
    <nav aria-label="페이지 이동" className={clsx("flex items-center gap-1", className)}>
      <button
        type="button"
        className={clsx(itemBase, itemIdle, isFirst && itemDisabled)}
        disabled={isFirst}
        onClick={() => onChange(current - 1)}
      >
        이전
      </button>

      {items.map((item) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            aria-label={`${item}페이지`}
            aria-current={item === current ? "page" : undefined}
            className={clsx(itemBase, item === current ? itemActive : itemIdle)}
            onClick={() => item !== current && onChange(item)}
          >
            {item}
          </button>
        ) : (
          <span
            key={item}
            aria-hidden="true"
            className="inline-flex h-8 min-w-8 items-center justify-center text-xs text-[var(--color-gray-500,#6b7280)]"
          >
            …
          </span>
        ),
      )}

      <button
        type="button"
        className={clsx(itemBase, itemIdle, isLast && itemDisabled)}
        disabled={isLast}
        onClick={() => onChange(current + 1)}
      >
        다음
      </button>
    </nav>
  );
}
