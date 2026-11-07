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
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  const set = (key: keyof ProductFormValues) => (value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: { name?: string; price?: string } = {};
    if (!values.name.trim()) next.name = "상품명을 입력해 주세요.";
    if (values.price === "" || Number(values.price) < 0) next.price = "올바른 가격을 입력해 주세요.";
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-ds-4" noValidate>
      <h2 className="text-ds-xl font-semibold text-ds-blue-900">상품 등록</h2>

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

      <label htmlFor="product-description" className="block text-sm text-ds-gray-500">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          className="mt-1 block w-full rounded-ds-sm border border-ds-gray-100 bg-white px-ds-3 py-ds-2 text-ds-blue-900 focus:border-ds-blue-400 focus:outline-none"
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
