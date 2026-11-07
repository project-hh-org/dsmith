"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface FilterValue {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export interface FilterSidebarProps {
  categories: string[];
  value?: FilterValue;
  onChange?: (value: FilterValue) => void;
}

const EMPTY: FilterValue = { categories: [], minPrice: "", maxPrice: "" };

const inputClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] placeholder:text-[var(--color-gray-500)]";

export function FilterSidebar({ categories, value, onChange }: FilterSidebarProps) {
  const [inner, setInner] = useState<FilterValue>(EMPTY);
  const current = value ?? inner;

  const update = (next: FilterValue) => {
    if (!value) setInner(next);
    onChange?.(next);
  };

  const toggleCategory = (category: string) => {
    const selected = current.categories.includes(category)
      ? current.categories.filter((c) => c !== category)
      : [...current.categories, category];
    update({ ...current, categories: selected });
  };

  const priceInvalid =
    current.minPrice !== "" &&
    current.maxPrice !== "" &&
    Number(current.minPrice) > Number(current.maxPrice);

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-56 flex-col gap-[var(--space-5)] border-r border-[var(--color-gray-100)] bg-[var(--color-gray-50)] p-[var(--space-4)]"
    >
      <fieldset className="flex flex-col gap-[var(--space-3)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-bold text-[var(--color-blue-900)]">
          카테고리
        </legend>
        {categories.map((category) => (
          <label
            key={category}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={current.categories.includes(category)}
              onChange={() => toggleCategory(category)}
            />
            {category}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-bold text-[var(--color-blue-900)]">
          가격 범위
        </legend>
        <div className="flex items-center gap-[var(--space-2)]">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최소 가격"
            placeholder="최소"
            value={current.minPrice}
            onChange={(e) => update({ ...current, minPrice: e.target.value })}
            className={inputClass}
          />
          <span className="text-[var(--color-gray-500)]">~</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label="최대 가격"
            placeholder="최대"
            value={current.maxPrice}
            onChange={(e) => update({ ...current, maxPrice: e.target.value })}
            className={inputClass}
          />
        </div>
        {priceInvalid && (
          <p role="alert" className="text-[length:var(--text-xs)] text-[var(--color-red-500)]">
            최소 가격이 최대 가격보다 클 수 없습니다.
          </p>
        )}
      </fieldset>

      <Button type="button" variant="outline" size="sm" onClick={() => update(EMPTY)}>
        초기화
      </Button>
    </aside>
  );
}
