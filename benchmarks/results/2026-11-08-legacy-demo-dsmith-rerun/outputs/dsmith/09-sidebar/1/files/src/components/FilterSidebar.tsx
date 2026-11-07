"use client";

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

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

const inputClass =
  "block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] " +
  "text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();
  const minId = `${uid}-min`;
  const maxId = `${uid}-max`;

  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="w-56 bg-[var(--color-gray-50)] border border-[var(--color-gray-100)] rounded-[var(--radius-sm)] p-[var(--space-4)] flex flex-col gap-[var(--space-5)]"
    >
      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-[var(--color-blue-900)]">
          카테고리
        </legend>
        {categories.map((category) => (
          <label
            key={category.value}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={value.categories.includes(category.value)}
              onChange={() => toggleCategory(category.value)}
            />
            {category.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-[var(--color-blue-900)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <label htmlFor={minId} className="sr-only">
            최소 가격
          </label>
          <input
            id={minId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            aria-invalid={priceInvalid}
            className={inputClass}
          />
          <span className="text-[var(--color-gray-500)]" aria-hidden="true">
            ~
          </span>
          <label htmlFor={maxId} className="sr-only">
            최대 가격
          </label>
          <input
            id={maxId}
            type="number"
            min={0}
            inputMode="numeric"
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

      <Button type="button" variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}
