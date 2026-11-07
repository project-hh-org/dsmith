"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface ProductFormProps {
  categories?: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const field =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-blue-900)]";
const label = "flex flex-col gap-[var(--space-2)] text-[length:var(--text-xs)] text-[var(--color-gray-500)]";

export function ProductForm({ categories = [], initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [price, setPrice] = useState(initialValues?.price?.toString() ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-4)]">
      <label className={label}>
        상품명
        <input className={field} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className={label}>
        가격
        <input
          className={field}
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>
      <label className={label}>
        카테고리
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">선택하세요</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className={label}>
        설명
        <textarea
          className={field}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="flex justify-end gap-[var(--space-2)]">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
