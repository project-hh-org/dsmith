"use client";

import { useState } from "react";
import type { FormEvent } from "react";
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
  { value: "clothing", label: "의류" },
  { value: "electronics", label: "전자제품" },
  { value: "food", label: "식품" },
  { value: "etc", label: "기타" },
];

const fieldClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand";

export function ProductForm({
  categories = defaultCategories,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price?.toString() ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="product-name" className="text-sm font-medium text-gray-900">
          상품명
        </label>
        <input
          id="product-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="product-price" className="text-sm font-medium text-gray-900">
          가격
        </label>
        <input
          id="product-price"
          type="number"
          required
          min={0}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="product-category" className="text-sm font-medium text-gray-900">
          카테고리
        </label>
        <select
          id="product-category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClass}
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
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="product-description" className="text-sm font-medium text-gray-900">
          설명
        </label>
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
