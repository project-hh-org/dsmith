"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTER: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

export interface FilterSidebarProps {
  categories: string[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onReset?: () => void;
}

const inputClass =
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] " +
  "text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();

  const toggleCategory = (category: string) => {
    const next = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories: next });
  };

  const minNum = value.minPrice === "" ? NaN : Number(value.minPrice);
  const maxNum = value.maxPrice === "" ? NaN : Number(value.maxPrice);
  const rangeInvalid = !Number.isNaN(minNum) && !Number.isNaN(maxNum) && minNum > maxNum;

  const reset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-56 flex-col gap-[var(--space-5)] border-r border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((category, i) => {
          const id = `${uid}-cat-${i}`;
          return (
            <label
              key={category}
              htmlFor={id}
              className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
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
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label="최소 가격"
            aria-invalid={rangeInvalid}
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className={inputClass}
          />
          <span className="text-[var(--color-gray-500)]">~</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label="최대 가격"
            aria-invalid={rangeInvalid}
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={inputClass}
          />
        </div>
        {rangeInvalid && (
          <span role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </span>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
