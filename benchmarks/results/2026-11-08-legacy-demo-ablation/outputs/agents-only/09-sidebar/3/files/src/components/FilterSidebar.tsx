"use client";

import { useId } from "react";
import { Button } from "./ui/button";
import { Input } from "./forms/Input";

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

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const uid = useId();

  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
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
      className="w-56 shrink-0 border border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]"
    >
      <h2 className="mb-[var(--space-4)] text-[length:var(--text-xl)] font-bold text-[var(--color-blue-900)]">
        필터
      </h2>

      <fieldset className="mb-[var(--space-5)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        <ul className="flex flex-col gap-[var(--space-2)]">
          {categories.map((c) => {
            const id = `${uid}-cat-${c.value}`;
            return (
              <li key={c.value} className="flex items-center gap-[var(--space-2)]">
                <input
                  id={id}
                  type="checkbox"
                  checked={value.categories.includes(c.value)}
                  onChange={() => toggleCategory(c.value)}
                />
                <label htmlFor={id} className="text-[var(--color-blue-900)]">
                  {c.label}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset className="mb-[var(--space-5)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          가격 범위
        </legend>
        <div className="flex flex-col gap-[var(--space-3)]">
          <Input
            id={`${uid}-min`}
            label="최소 가격"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <Input
            id={`${uid}-max`}
            label="최대 가격"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="제한 없음"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
            error={rangeInvalid ? "최소 가격이 최대 가격보다 클 수 없습니다" : undefined}
          />
        </div>
      </fieldset>

      <Button type="button" variant="outline" className="w-full" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}
