"use client";

import clsx from "clsx";
import { useId } from "react";
import { Button } from "./ui/button";

export interface FilterCategory {
  id: string;
  label: string;
}

export interface FilterState {
  categories: string[];
  minPrice: string;
  maxPrice: string;
}

export const emptyFilter: FilterState = { categories: [], minPrice: "", maxPrice: "" };

export interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  className?: string;
}

const inputClass = clsx(
  "w-full border border-[var(--color-gray-100)] bg-white text-[var(--color-blue-900)]",
  "rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-2)] text-[length:var(--text-xs)]",
);

export function FilterSidebar({ categories, value, onChange, className }: FilterSidebarProps) {
  const uid = useId();
  const priceInvalid =
    value.minPrice !== "" && value.maxPrice !== "" && Number(value.minPrice) > Number(value.maxPrice);

  const toggleCategory = (id: string) => {
    const categories = value.categories.includes(id)
      ? value.categories.filter((c) => c !== id)
      : [...value.categories, id];
    onChange({ ...value, categories });
  };

  return (
    <aside
      aria-label="상품 필터"
      className={clsx(
        "flex w-full max-w-xs flex-col gap-[var(--space-5)] border border-[var(--color-gray-100)]",
        "bg-[var(--color-gray-50)] p-[var(--space-4)] rounded-[var(--radius-sm)]",
        className,
      )}
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">필터</h2>

      <fieldset className="flex flex-col gap-[var(--space-3)]">
        <legend className="mb-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-gray-500)]">
          카테고리
        </legend>
        {categories.map((c) => {
          const id = `${uid}-cat-${c.id}`;
          return (
            <label
              key={c.id}
              htmlFor={id}
              className="flex items-center gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]"
            >
              <input
                id={id}
                type="checkbox"
                checked={value.categories.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
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
          <span aria-hidden className="text-[var(--color-gray-500)]">~</span>
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
