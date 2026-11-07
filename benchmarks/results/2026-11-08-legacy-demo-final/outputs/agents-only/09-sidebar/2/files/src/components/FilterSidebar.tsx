import { useId } from "react";
import { Button } from "./ui/button";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}

export const emptyFilter: FilterState = { categories: [], minPrice: "", maxPrice: "" };

const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] " +
  "focus:outline-none focus:border-[var(--color-blue-400)]";

export function FilterSidebar({ categories, value, onChange, className }: FilterSidebarProps) {
  const id = useId();

  const toggleCategory = (v: string) => {
    const next = value.categories.includes(v)
      ? value.categories.filter((c) => c !== v)
      : [...value.categories, v];
    onChange({ ...value, categories: next });
  };

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  return (
    <aside
      aria-label="상품 필터"
      className={
        "flex w-64 flex-col gap-[var(--space-5)] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] " +
        "bg-[var(--color-gray-50)] p-[var(--space-4)] text-[var(--color-blue-900)]" +
        (className ? ` ${className}` : "")
      }
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-3)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((c) => {
          const inputId = `${id}-${c.value}`;
          return (
            <label
              key={c.value}
              htmlFor={inputId}
              className="flex cursor-pointer items-center gap-[var(--space-2)] text-[length:var(--text-xs)]"
            >
              <input
                id={inputId}
                type="checkbox"
                checked={value.categories.includes(c.value)}
                onChange={() => toggleCategory(c.value)}
                className="accent-[var(--color-blue-400)]"
              />
              {c.label}
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            aria-invalid={priceInvalid}
            className={inputClass}
          />
          <span aria-hidden className="text-[var(--color-gray-500)]">
            ~
          </span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            aria-invalid={priceInvalid}
            className={inputClass}
          />
        </div>
        {priceInvalid && (
          <p role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" onClick={() => onChange(emptyFilter)}>
        초기화
      </Button>
    </aside>
  );
}
