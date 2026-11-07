import { useId } from "react";
import { Button } from "./ui/button";

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: string[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

export const emptyFilter: FilterState = { categories: [], minPrice: "", maxPrice: "" };

const inputClass =
  "w-full border border-[var(--color-gray-100)] rounded-[var(--radius-sm)] " +
  "px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)] " +
  "text-[color:var(--color-blue-900)]";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const id = useId();

  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const reset = () => {
    onChange(emptyFilter);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="flex flex-col bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-[var(--radius-sm)] p-[var(--space-4)] gap-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] text-[color:var(--color-blue-900)] font-semibold">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((category, i) => {
          const inputId = `${id}-cat-${i}`;
          return (
            <label
              key={category}
              htmlFor={inputId}
              className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]"
            >
              <input
                id={inputId}
                type="checkbox"
                checked={value.categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {category}
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            className={inputClass}
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <span className="text-[color:var(--color-gray-500)]">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            className={inputClass}
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          />
        </div>
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
