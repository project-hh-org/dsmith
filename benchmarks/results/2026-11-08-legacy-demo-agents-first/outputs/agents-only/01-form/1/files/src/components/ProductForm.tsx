"use client";

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

export interface ProductFormProps {
  categories?: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "", label: "카테고리 선택" },
  { value: "food", label: "식품" },
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자제품" },
  { value: "etc", label: "기타" },
];

export function ProductForm({
  categories = DEFAULT_CATEGORIES,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력하세요.";
    if (!values.price || Number(values.price) < 0) next.price = "올바른 가격을 입력하세요.";
    if (!values.category) next.category = "카테고리를 선택하세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-[var(--space-4)] p-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-blue-900)]">
        상품 등록
      </h2>

      <Input
        id="product-name"
        label="상품명"
        value={values.name}
        onChange={(e) => set("name")(e.target.value)}
        error={errors.name}
        placeholder="상품명을 입력하세요"
      />

      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={values.price}
        onChange={(e) => set("price")(e.target.value)}
        error={errors.price}
        placeholder="0"
      />

      <div>
        <Select
          label="카테고리"
          options={categories}
          value={values.category}
          onChange={(e) => set("category")(e.target.value)}
        />
        {errors.category && (
          <span className="mt-1 block text-[length:var(--text-xs)] text-[color:var(--color-red-500)]">
            {errors.category}
          </span>
        )}
      </div>

      <label className="block text-sm text-[color:var(--color-gray-500)]">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="상품 설명을 입력하세요"
          className="mt-1 block w-full rounded-[var(--radius-sm)] border border-[color:var(--color-gray-100)] px-[var(--space-3)] py-[var(--space-2)] text-[color:var(--color-blue-900)] focus:border-[color:var(--color-blue-400)] focus:outline-none"
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
