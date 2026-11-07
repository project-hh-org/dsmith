"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: string;
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
  "mt-1 block w-full rounded-ds-sm border border-ds-gray-100 bg-white px-ds-3 py-ds-2 text-ds-xs text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none";
const labelClass = "block text-ds-xs text-ds-gray-500";
const errorClass = "mt-1 block text-ds-xs text-ds-red-500";

export function ProductForm({ categories, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    price: initialValues?.price ?? "",
    category: initialValues?.category ?? "",
    description: initialValues?.description ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  const set = (key: keyof ProductFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력해 주세요.";
    if (values.price === "" || Number(values.price) < 0 || Number.isNaN(Number(values.price))) {
      next.price = "0 이상의 가격을 입력해 주세요.";
    }
    if (!values.category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-ds-4">
      <h2 className="text-ds-xl font-semibold text-ds-blue-900">상품 등록</h2>

      <label htmlFor="product-name" className={labelClass}>
        상품명
        <input
          id="product-name"
          type="text"
          value={values.name}
          onChange={(e) => set("name")(e.target.value)}
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
          inputMode="numeric"
          value={values.price}
          onChange={(e) => set("price")(e.target.value)}
          aria-invalid={!!errors.price}
          className={fieldClass}
        />
        {errors.price && <span className={errorClass}>{errors.price}</span>}
      </label>

      <label htmlFor="product-category" className={labelClass}>
        카테고리
        <select
          id="product-category"
          value={values.category}
          onChange={(e) => set("category")(e.target.value)}
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
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          className={fieldClass}
        />
      </label>

      <div className="flex justify-end gap-ds-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
