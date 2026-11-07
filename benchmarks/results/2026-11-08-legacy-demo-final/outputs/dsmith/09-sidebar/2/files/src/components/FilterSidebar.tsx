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
  "w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-100)] bg-white px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]";

export function FilterSidebar({ categories, value, onChange }: FilterSidebarProps) {
  const [inner, setInner] = useState<FilterValue>(EMPTY);
  const current = value ?? inner;

  const update = (next: FilterValue) => {
    if (!value) setInner(next);
    onChange?.(next);
  };

  const toggleCategory = (name: string) => {
    const selected = current.categories.includes(name)
      ? current.categories.filter((c) => c !== name)
      : [...current.categories, name];
    update({ ...current, categories: selected });
  };

  return (
    <aside
      aria-label="상품 필터"
      className="flex w-56 flex-col gap-[var(--space-5)] border-r border-[color:var(--color-gray-100)] bg-[color:var(--color-gray-50)] p-[var(--space-4)]"
    >
      <fieldset className="flex flex-col gap-[var(--space-3)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-semibold text-[color:var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((name) => (
          <label
            key={name}
            className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-blue-900)]"
          >
            <input
              type="checkbox"
              checked={current.categories.includes(name)}
              onChange={() => toggleCategory(name)}
            />
            {name}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-[var(--space-2)]">
        <legend className="mb-[var(--space-3)] text-[length:var(--text-xs)] font-semibold text-[color:var(--color-gray-500)]">
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
          <span className="text-[color:var(--color-gray-500)]">~</span>
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
      </fieldset>

      <Button variant="outline" size="sm" type="button" onClick={() => update(EMPTY)}>
        초기화
      </Button>
    </aside>
  );
}
