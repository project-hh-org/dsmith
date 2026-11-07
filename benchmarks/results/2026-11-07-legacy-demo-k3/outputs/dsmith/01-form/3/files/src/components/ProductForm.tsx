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
  initialValues?: Partial<ProductFormValues>;
  categories?: { value: string; label: string }[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const defaultCategories = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자제품" },
  { value: "food", label: "식품" },
  { value: "etc", label: "기타" },
];

export function ProductForm({
  initialValues,
  categories = defaultCategories,
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
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
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
        {errors.category && <span className="mt-1 block text-xs text-red-500">{errors.category}</span>}
      </div>
      <label htmlFor="product-description" className="block text-sm text-gray-700">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          placeholder="상품 설명을 입력하세요"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
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
