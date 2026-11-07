"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./forms/Input";
import { Select } from "./forms/Select";

export interface ProductFormValues {
  name: string;
  price: number;
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
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string }>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "상품명을 입력해 주세요.";
    const priceNum = Number(price);
    if (price === "" || Number.isNaN(priceNum) || priceNum < 0) next.price = "올바른 가격을 입력해 주세요.";
    if (!category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ name: name.trim(), price: priceNum, category, description });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        id="product-name"
        label="상품명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        required
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
        required
      />
      <div>
        <Select
          label="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[{ value: "", label: "선택해 주세요" }, ...categories]}
          required
        />
        {errors.category && (
          <span className="mt-1 block text-xs text-[var(--color-red-500)]">{errors.category}</span>
        )}
      </div>
      <label htmlFor="product-description" className="block text-sm text-gray-700">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[var(--color-blue-400)] focus:outline-none"
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
