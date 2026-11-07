"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/Input";
import { Select } from "@/components/forms/Select";

export interface ProductFormValues {
  name: string;
  price: number;
  category: string;
  description: string;
}

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  categories?: { value: string; label: string }[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자기기" },
  { value: "living", label: "생활용품" },
  { value: "food", label: "식품" },
];

export function ProductForm({
  initialValues,
  categories = DEFAULT_CATEGORIES,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(
    initialValues?.price !== undefined ? String(initialValues.price) : "",
  );
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [errors, setErrors] = useState<{ name?: string; price?: string; category?: string }>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "상품명을 입력해 주세요.";
    if (price === "" || Number(price) < 0 || Number.isNaN(Number(price))) {
      next.price = "0 이상의 가격을 입력해 주세요.";
    }
    if (!category) next.category = "카테고리를 선택해 주세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        id="product-name"
        label="상품명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="상품명을 입력하세요"
      />
      <Input
        id="product-price"
        label="가격 (원)"
        type="number"
        min={0}
        step={100}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={errors.price}
        placeholder="0"
      />
      <div>
        <Select
          label="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={categories}
        />
        {errors.category && <span className="mt-1 block text-xs text-red-500">{errors.category}</span>}
      </div>
      <label htmlFor="product-description" className="block text-sm text-gray-700">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품 설명을 입력하세요"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
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
