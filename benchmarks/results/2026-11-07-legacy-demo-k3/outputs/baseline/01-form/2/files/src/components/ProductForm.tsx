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
  categories?: { value: string; label: string }[];
  saving?: boolean;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  { value: "", label: "카테고리 선택" },
  { value: "fashion", label: "패션" },
  { value: "beauty", label: "뷰티" },
  { value: "living", label: "리빙" },
  { value: "digital", label: "디지털" },
];

export function ProductForm({
  initialValues,
  categories = DEFAULT_CATEGORIES,
  saving = false,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price != null ? String(initialValues.price) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && name.trim() === "" ? "상품명을 입력해 주세요." : undefined;
  const priceError =
    submitted && (price === "" || Number(price) < 0) ? "가격을 0원 이상으로 입력해 주세요." : undefined;
  const categoryError = submitted && category === "" ? "카테고리를 선택해 주세요." : undefined;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (name.trim() === "" || price === "" || Number(price) < 0 || category === "") return;
    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4" noValidate>
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
      <div>
        <Select
          label="카테고리"
          value={category}
          options={categories}
          onChange={(e) => setCategory(e.target.value)}
        />
        {categoryError && <span className="mt-1 block text-xs text-red-600">{categoryError}</span>}
      </div>
      <label htmlFor="productDescription" className="block text-sm text-gray-700">
        설명
        <textarea
          id="productDescription"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand focus:outline-none"
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
