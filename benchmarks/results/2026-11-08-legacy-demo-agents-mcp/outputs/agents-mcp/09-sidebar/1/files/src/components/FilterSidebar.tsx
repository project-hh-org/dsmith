"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";

export interface FilterCategory {
  value: string;
  label: string;
}

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const EMPTY_FILTER: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  onReset?: () => void;
}

const priceInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();
  const minId = `${uid}-min`;
  const maxId = `${uid}-max`;

  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const reset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-60 flex-col gap-[var(--space-5)] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
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
              className="h-4 w-4 accent-[var(--color-blue-400)]"
            />
            {category.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <label htmlFor={minId} className="sr-only">
            최소 가격
          </label>
          <input
            id={minId}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최소"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            aria-invalid={priceInvalid}
            className={priceInputClass}
          />
          <span aria-hidden className="text-[var(--color-gray-500)]">
            ~
          </span>
          <label htmlFor={maxId} className="sr-only">
            최대 가격
          </label>
          <input
            id={maxId}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최대"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            aria-invalid={priceInvalid}
            className={priceInputClass}
          />
        </div>
        {priceInvalid && (
          <p role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
