import { Button } from "./ui/button";
import { Input } from "./forms/Input";

export interface FilterCategory {
  value: string;
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
  onReset?: () => void;
  className?: string;
}

export function FilterSidebar({ categories, value, onChange, onReset, className }: FilterSidebarProps) {
  const toggle = (cat: string) => {
    const next = value.categories.includes(cat)
      ? value.categories.filter((c) => c !== cat)
      : [...value.categories, cat];
    onChange({ ...value, categories: next });
  };

  const min = value.minPrice === "" ? NaN : Number(value.minPrice);
  const max = value.maxPrice === "" ? NaN : Number(value.maxPrice);
  const rangeError = !Number.isNaN(min) && !Number.isNaN(max) && min > max;

  const reset = () => {
    onChange(emptyFilter);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className={`flex flex-col gap-ds-5 rounded-ds-sm border border-ds-gray-100 bg-ds-gray-50 p-ds-4 ${className ?? ""}`}
    >
      <h2 className="text-ds-xl font-semibold text-ds-blue-900">필터</h2>

      <fieldset className="flex flex-col gap-ds-2">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">카테고리</legend>
        {categories.map((c) => (
          <label key={c.value} className="flex items-center gap-ds-2 text-ds-xs text-ds-blue-900">
            <input
              type="checkbox"
              checked={value.categories.includes(c.value)}
              onChange={() => toggle(c.value)}
            />
            {c.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-ds-3">
        <legend className="mb-ds-2 text-ds-xs font-medium text-ds-gray-500">가격 범위</legend>
        <Input
          id="filter-min-price"
          label="최소 가격"
          type="number"
          min={0}
          inputMode="numeric"
          value={value.minPrice}
          onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
        />
        <Input
          id="filter-max-price"
          label="최대 가격"
          type="number"
          min={0}
          inputMode="numeric"
          value={value.maxPrice}
          onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          error={rangeError ? "최소 가격이 최대 가격보다 클 수 없습니다." : undefined}
        />
      </fieldset>

      <Button type="button" variant="outline" onClick={reset}>
        초기화
      </Button>
    </aside>
  );
}
