"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./Button";
import { Input } from "./forms/Input";
import { Select } from "./forms/Select";

export interface ProductFormValues {
  name: string;
  price: number;
  category: string;
  description: string;
}

interface ProductFormProps {
  categories: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export function ProductForm({ categories, initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price !== undefined ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? categories[0]?.value ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: { name?: string; price?: string } = {};
    if (!name.trim()) next.name = "상품명을 입력해 주세요.";
    const priceNumber = Number(price);
    if (price === "" || Number.isNaN(priceNumber) || priceNumber < 0) {
      next.price = "0 이상의 가격을 입력해 주세요.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({ name: name.trim(), price: priceNumber, category, description });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="product-name"
        label="상품명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
      />
      <Select
        label="카테고리"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categories}
      />
      <label htmlFor="product-description" className="block text-sm text-gray-700">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#3B82F6] focus:outline-none"
        />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
