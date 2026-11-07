"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

const priceInputClass =
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();
  const min = Number(value.minPrice);
  const max = Number(value.maxPrice);
  const rangeInvalid = value.minPrice !== "" && value.maxPrice !== "" && min > max;

  const toggleCategory = (cat: string) => {
    const categories = value.categories.includes(cat)
      ? value.categories.filter((c) => c !== cat)
      : [...value.categories, cat];
    onChange({ ...value, categories });
  };

  const reset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="w-56 shrink-0 bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-[var(--radius-sm)] p-[var(--space-4)] flex flex-col gap-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((cat) => {
          const id = `${uid}-cat-${cat.value}`;
          return (
            <label
              key={cat.value}
              htmlFor={id}
              className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
            >
              <input
                id={id}
                type="checkbox"
                checked={value.categories.includes(cat.value)}
                onChange={() => toggleCategory(cat.value)}
                className="h-4 w-4 accent-[var(--color-blue-400)]"
              />
              {cat.label}
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
            aria-invalid={rangeInvalid}
            className={priceInputClass}
          />
          <span className="text-[var(--color-gray-500)]" aria-hidden>
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
            aria-invalid={rangeInvalid}
            className={priceInputClass}
          />
        </div>
        {rangeInvalid && (
          <p role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 큽니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
