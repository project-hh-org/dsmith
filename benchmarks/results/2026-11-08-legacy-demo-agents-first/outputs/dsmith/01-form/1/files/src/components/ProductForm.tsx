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
  categories: { value: string; label: string }[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export function ProductForm({ initialValues, categories, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    price: "",
    category: categories[0]?.value ?? "",
    description: "",
    ...initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<"name" | "price", string>>>({});

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "상품명을 입력해 주세요.";
    const price = Number(values.price);
    if (values.price === "" || Number.isNaN(price) || price < 0) next.price = "올바른 가격을 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-ds-4" noValidate>
      <Input
        id="product-name"
        label="상품명"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        error={errors.name}
        required
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={values.price}
        onChange={(e) => set("price", e.target.value)}
        error={errors.price}
        required
      />
      <Select
        label="카테고리"
        value={values.category}
        onChange={(e) => set("category", e.target.value)}
        options={categories}
      />
      <label htmlFor="product-description" className="block text-sm text-ds-gray-500">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="mt-1 block w-full rounded-ds-sm border border-ds-gray-100 px-ds-3 py-ds-2 text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none"
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
