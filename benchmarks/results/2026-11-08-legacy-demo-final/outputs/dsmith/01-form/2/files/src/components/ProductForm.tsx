import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: string;
  category: string;
  description: string;
}

export interface ProductFormProps {
  categories?: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const defaultCategories = [
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자제품" },
  { value: "food", label: "식품" },
  { value: "etc", label: "기타" },
];

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] focus:outline-none focus:border-[var(--color-blue-400)]";

const labelClass =
  "flex flex-col gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]";

export function ProductForm({
  categories = defaultCategories,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    price: initialValues?.price ?? "",
    category: initialValues?.category ?? "",
    description: initialValues?.description ?? "",
  });

  const set =
    (key: keyof ProductFormValues) =>
    (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-medium text-[var(--color-blue-900)]">
        상품 등록
      </h2>

      <label className={labelClass}>
        상품명
        <input
          type="text"
          required
          value={values.name}
          onChange={set("name")}
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        가격
        <input
          type="number"
          required
          min={0}
          value={values.price}
          onChange={set("price")}
          className={fieldClass}
        />
      </label>

      <label className={labelClass}>
        카테고리
        <select
          required
          value={values.category}
          onChange={set("category")}
          className={fieldClass}
        >
          <option value="" disabled>
            카테고리 선택
          </option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        설명
        <textarea
          rows={4}
          value={values.description}
          onChange={set("description")}
          className={fieldClass}
        />
      </label>

      <div className="flex justify-end gap-[var(--space-2)]">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
