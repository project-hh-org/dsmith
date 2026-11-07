"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: number;
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
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand focus:outline-none";
const labelClass = "flex flex-col gap-2 text-sm font-medium text-gray-900";

export function ProductForm({
  categories = defaultCategories,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <label className={labelClass}>
        상품명
        <input
          className={fieldClass}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="상품명을 입력하세요"
          required
        />
      </label>

      <label className={labelClass}>
        가격 (원)
        <input
          className={fieldClass}
          type="number"
          min={0}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          required
        />
      </label>

      <label className={labelClass}>
        카테고리
        <select
          className={fieldClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="" disabled>
            카테고리를 선택하세요
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
          className={fieldClass}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품 설명을 입력하세요"
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
