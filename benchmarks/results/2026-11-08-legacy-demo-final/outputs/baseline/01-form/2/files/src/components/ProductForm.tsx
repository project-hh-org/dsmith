"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/Button";
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
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "beauty", label: "뷰티" },
  { value: "food", label: "식품" },
  { value: "living", label: "생활" },
  { value: "digital", label: "디지털" },
];

export function ProductForm({ initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = {
    name: name.trim() === "" ? "상품명을 입력해 주세요." : undefined,
    price:
      price === "" || Number(price) < 0 || Number.isNaN(Number(price))
        ? "0 이상의 가격을 입력해 주세요."
        : undefined,
    category: category === "" ? "카테고리를 선택해 주세요." : undefined,
  };
  const hasError = Boolean(errors.name || errors.price || errors.category);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (hasError) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), price: Number(price), category, description });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg p-4 space-y-4 border border-gray-300">
      <h2 className="font-semibold text-gray-900">상품 등록</h2>

      <Input
        id="product-name"
        label="상품명"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={submitted ? errors.name : undefined}
      />
      <Input
        id="product-price"
        label="가격 (원)"
        type="number"
        min={0}
        step={100}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        error={submitted ? errors.price : undefined}
      />
      <div>
        <Select
          label="카테고리"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={CATEGORY_OPTIONS}
        />
        {submitted && errors.category && (
          <span className="mt-1 block text-xs text-red-600">{errors.category}</span>
        )}
      </div>
      <label htmlFor="product-description" className="block text-sm text-gray-700">
        설명
        <textarea
          id="product-description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          취소
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
