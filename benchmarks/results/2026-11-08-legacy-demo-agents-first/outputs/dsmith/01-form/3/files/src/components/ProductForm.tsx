"use client";

import { useState, type FormEvent } from "react";
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
  initialValues?: Partial<ProductFormValues>;
  categories?: { value: string; label: string }[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자제품" },
  { value: "food", label: "식품" },
  { value: "etc", label: "기타" },
];

export function ProductForm({
  initialValues,
  categories = DEFAULT_CATEGORIES,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    price: initialValues?.price ?? "",
    category: initialValues?.category ?? "",
    description: initialValues?.description ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormValues, string>>>({});

  const set = (key: keyof ProductFormValues, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력해 주세요.";
    if (values.price === "" || Number(values.price) < 0) next.price = "가격을 0 이상으로 입력해 주세요.";
    if (!values.category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-md"
      style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
    >
      <Input
        id="product-name"
        label="상품명"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        error={errors.name}
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={values.price}
        onChange={(e) => set("price", e.target.value)}
        error={errors.price}
      />
      <div>
        <Select
          label="카테고리"
          options={categories}
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
        />
        {errors.category && (
          <span
            className="block"
            style={{
              marginTop: "var(--space-2)",
              fontSize: "var(--text-xs)",
              color: "var(--color-red-500)",
            }}
          >
            {errors.category}
          </span>
        )}
      </div>
      <label className="block text-sm text-gray-700" htmlFor="product-description">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="block w-full rounded-md border border-gray-300"
          style={{
            marginTop: "var(--space-2)",
            padding: "var(--space-2) var(--space-3)",
            color: "var(--color-blue-900)",
          }}
        />
      </label>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
