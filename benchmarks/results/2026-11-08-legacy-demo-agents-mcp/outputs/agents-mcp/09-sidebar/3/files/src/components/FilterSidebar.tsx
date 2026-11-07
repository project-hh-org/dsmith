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
  className?: string;
}

const priceInputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] " +
  "focus:border-[var(--color-blue-400)] focus:outline-none";

export function FilterSidebar({ categories, value, onChange, onReset, className }: FilterSidebarProps) {
  const uid = useId();
  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);
  const isDirty = value.categories.length > 0 || value.minPrice !== "" || value.maxPrice !== "";

  const toggleCategory = (cat: string) => {
    const categories = value.categories.includes(cat)
      ? value.categories.filter((c) => c !== cat)
      : [...value.categories, cat];
    onChange({ ...value, categories });
  };

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className={
        "flex w-56 flex-col gap-[var(--space-5)] rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] " +
        "bg-[var(--color-gray-50)] p-[var(--space-4)]" +
        (className ? ` ${className}` : "")
      }
    >
      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-[var(--color-blue-900)]">
          카테고리
        </legend>
        {categories.map((cat) => {
          const id = `${uid}-cat-${cat.value}`;
          return (
            <label
              key={cat.value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
            >
              <input
                id={id}
                type="checkbox"
                checked={value.categories.includes(cat.value)}
                onChange={() => toggleCategory(cat.value)}
                className="accent-[var(--color-blue-400)]"
              />
              {cat.label}
            </label>
          );
        })}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-semibold text-[var(--color-blue-900)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최소"
            aria-label="최소 가격"
            aria-invalid={priceInvalid}
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
            className={priceInputClass}
          />
          <span className="text-[length:var(--text-xs)] text-[var(--color-gray-500)]">~</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="최대"
            aria-label="최대 가격"
            aria-invalid={priceInvalid}
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            className={priceInputClass}
          />
        </div>
        {priceInvalid && (
          <span role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 큽니다.
          </span>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={!isDirty}>
        초기화
      </Button>
    </aside>
  );
}
