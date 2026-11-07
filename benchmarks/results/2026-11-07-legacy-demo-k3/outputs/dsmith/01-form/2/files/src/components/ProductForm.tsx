"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface ProductCategory {
  value: string;
  label: string;
}

export interface ProductFormProps {
  categories: ProductCategory[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const fieldClass =
  "mt-[var(--space-2)] block w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[var(--color-blue-900)] " +
  "focus:border-[var(--color-blue-400)] focus:outline-none";
const labelClass = "block text-[length:var(--text-xs)] text-[var(--color-gray-500)]";
const errorClass = "mt-[var(--space-2)] block text-[length:var(--text-xs)] text-[var(--color-red-500)]";

export function ProductForm({ categories, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: typeof errors = {};
    const priceNumber = Number(price);
    if (!name.trim()) next.name = "상품명을 입력해 주세요.";
    if (price === "" || Number.isNaN(priceNumber) || priceNumber < 0) next.price = "0 이상의 가격을 입력해 주세요.";
    if (!category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ name: name.trim(), price: priceNumber, category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[var(--space-4)]">
      <label htmlFor="product-name" className={labelClass}>
        상품명
        <input
          id="product-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          className={fieldClass}
        />
        {errors.name && <span className={errorClass}>{errors.name}</span>}
      </label>

      <label htmlFor="product-price" className={labelClass}>
        가격
        <input
          id="product-price"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-invalid={!!errors.price}
          className={fieldClass}
        />
        {errors.price && <span className={errorClass}>{errors.price}</span>}
      </label>

      <label htmlFor="product-category" className={labelClass}>
        카테고리
        <select
          id="product-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-invalid={!!errors.category}
          className={fieldClass}
        >
          <option value="">선택하세요</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.category && <span className={errorClass}>{errors.category}</span>}
      </label>

      <label htmlFor="product-description" className={labelClass}>
        설명
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
