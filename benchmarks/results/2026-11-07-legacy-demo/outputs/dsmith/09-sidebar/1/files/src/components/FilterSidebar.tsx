"use client";

import { useId } from "react";
import { Button } from "./ui/button";

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

export interface FilterSidebarProps {
  categories: string[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

const priceInput =
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();

  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  const min = Number(value.minPrice);
  const max = Number(value.maxPrice);
  const rangeInvalid = value.minPrice !== "" && value.maxPrice !== "" && min > max;

  return (
    <aside
      aria-label="상품 필터"
      className="w-56 flex flex-col gap-[var(--space-5)] bg-[var(--color-gray-50)] border-r border-[var(--color-gray-100)] p-[var(--space-4)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[color:var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[color:var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((category) => {
          const id = `${uid}-${category}`;
          return (
            <label
              key={category}
              htmlFor={id}
              className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]"
            >
              <input
                id={id}
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
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[color:var(--color-gray-500)]">
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
            className={priceInput}
          />
          <span className="text-[color:var(--color-gray-500)]">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={priceInput}
          />
        </div>
        {rangeInvalid && (
          <span role="alert" className="text-[length:var(--text-xs)] text-[color:var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </span>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}
