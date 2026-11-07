import { Button } from "./Button";
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

interface FilterSidebarProps {
  categories: FilterCategory[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  onReset?: () => void;
}

export const EMPTY_FILTER: FilterState = { categories: [], minPrice: "", maxPrice: "" };

export function FilterSidebar({ categories, value, onChange, onReset }: FilterSidebarProps) {
  const toggleCategory = (category: string) => {
    const categories = value.categories.includes(category)
      ? value.categories.filter((c) => c !== category)
      : [...value.categories, category];
    onChange({ ...value, categories });
  };

  const min = value.minPrice === "" ? null : Number(value.minPrice);
  const max = value.maxPrice === "" ? null : Number(value.maxPrice);
  const rangeError =
    min !== null && max !== null && min > max ? "최소 가격이 최대 가격보다 클 수 없습니다" : undefined;

  const handleReset = () => {
    onChange(EMPTY_FILTER);
    onReset?.();
  };

  return (
    <aside
      aria-label="상품 필터"
      className="w-64 shrink-0 space-y-6 rounded-lg border border-gray-300 bg-white p-4"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-900">카테고리</legend>
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c.value}>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={value.categories.includes(c.value)}
                  onChange={() => toggleCategory(c.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {c.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-900">가격 범위</legend>
        <div className="flex items-start gap-2">
          <Input
            id="filter-min-price"
            label="최소"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="0"
            value={value.minPrice}
            onChange={(e) => onChange({ ...value, minPrice: e.target.value })}
          />
          <Input
            id="filter-max-price"
            label="최대"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="제한 없음"
            value={value.maxPrice}
            onChange={(e) => onChange({ ...value, maxPrice: e.target.value })}
          />
        </div>
        {rangeError && (
          <p role="alert" className="mt-1 text-xs text-[var(--color-red-500)]">
            {rangeError}
          </p>
        )}
      </fieldset>

      <Button type="button" variant="secondary" className="w-full" onClick={handleReset}>
        초기화
      </Button>
    </aside>
  );
}
