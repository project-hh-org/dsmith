"use client";

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
  { value: "electronics", label: "전자기기" },
  { value: "food", label: "식품" },
  { value: "living", label: "생활" },
];

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)] " +
  "placeholder:text-[var(--color-gray-500)] focus:outline-none focus:border-[var(--color-blue-400)]";

const labelClass = "flex flex-col gap-[var(--space-2)] text-[length:var(--text-xs)] font-medium text-[var(--color-blue-900)]";

export function ProductForm({ categories = defaultCategories, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    price: "",
    category: "",
    description: "",
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  const set = (key: keyof ProductFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력해 주세요.";
    if (values.price === "" || Number(values.price) < 0 || Number.isNaN(Number(values.price)))
      next.price = "올바른 가격을 입력해 주세요.";
    if (!values.category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  }

  const errorText = (msg?: string) =>
    msg ? (
      <span role="alert" className="font-normal text-[var(--color-red-500)]">
        {msg}
      </span>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-full max-w-md flex-col gap-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold text-[var(--color-blue-900)]">상품 등록</h2>

      <label className={labelClass}>
        상품명
        <input
          type="text"
          value={values.name}
          onChange={(e) => set("name")(e.target.value)}
          placeholder="상품명을 입력하세요"
          aria-invalid={!!errors.name}
          className={fieldClass}
        />
        {errorText(errors.name)}
      </label>

      <label className={labelClass}>
        가격 (원)
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={values.price}
          onChange={(e) => set("price")(e.target.value)}
          placeholder="0"
          aria-invalid={!!errors.price}
          className={fieldClass}
        />
        {errorText(errors.price)}
      </label>

      <label className={labelClass}>
        카테고리
        <select
          value={values.category}
          onChange={(e) => set("category")(e.target.value)}
          aria-invalid={!!errors.category}
          className={fieldClass}
        >
          <option value="">카테고리 선택</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {errorText(errors.category)}
      </label>

      <label className={labelClass}>
        설명
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="상품 설명을 입력하세요"
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
