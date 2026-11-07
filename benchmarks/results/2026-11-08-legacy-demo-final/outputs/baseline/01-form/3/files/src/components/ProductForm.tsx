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
  categories?: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  saving?: boolean;
  onSave: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "living", label: "리빙" },
  { value: "food", label: "식품" },
  { value: "digital", label: "디지털" },
];

export function ProductForm({
  categories = DEFAULT_CATEGORIES,
  initialValues,
  saving = false,
  onSave,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && name.trim() === "" ? "상품명을 입력해 주세요." : undefined;
  const priceError =
    submitted && (price === "" || Number(price) < 0) ? "올바른 가격을 입력해 주세요." : undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (name.trim() === "" || price === "" || Number(price) < 0) return;
    onSave({ name: name.trim(), price: Number(price), category, description });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-300 bg-white p-4">
      <Input
        id="productName"
        label="상품명"
        value={name}
        error={nameError}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        id="productPrice"
        label="가격 (원)"
        type="number"
        min={0}
        value={price}
        error={priceError}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Select
        label="카테고리"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={categories}
      />
      <label htmlFor="productDescription" className="block text-sm text-gray-700">
        설명
        <textarea
          id="productDescription"
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
        <Button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
