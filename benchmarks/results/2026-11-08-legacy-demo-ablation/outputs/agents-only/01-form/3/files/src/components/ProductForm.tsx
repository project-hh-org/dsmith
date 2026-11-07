import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./forms/Input";
import { Select } from "./forms/Select";

export interface ProductFormValues {
  name: string;
  price: string;
  category: string;
  description: string;
}

interface ProductFormProps {
  categories: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export function ProductForm({ categories, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    price: "",
    category: categories[0]?.value ?? "",
    description: "",
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  const set = (key: keyof ProductFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력하세요.";
    if (values.price === "" || Number(values.price) < 0) next.price = "올바른 가격을 입력하세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-[var(--space-4)] p-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] text-[var(--color-blue-900)]">상품 등록</h2>

      <Input
        id="product-name"
        label="상품명"
        value={values.name}
        error={errors.name}
        onChange={(e) => set("name")(e.target.value)}
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={values.price}
        error={errors.price}
        onChange={(e) => set("price")(e.target.value)}
      />
      <Select
        label="카테고리"
        options={categories}
        value={values.category}
        onChange={(e) => set("category")(e.target.value)}
      />
      <label className="block text-[length:var(--text-xs)] text-[var(--color-gray-500)]">
        설명
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          className="mt-1 block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-blue-900)] focus:border-[var(--color-blue-400)] focus:outline-none"
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
