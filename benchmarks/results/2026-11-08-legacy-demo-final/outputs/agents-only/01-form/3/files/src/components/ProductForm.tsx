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
  categories?: string[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel?: () => void;
}

const fieldClass =
  "w-full rounded-[var(--radius-sm)] border border-[var(--color-gray-100)] bg-white " +
  "px-[var(--space-3)] py-[var(--space-2)] text-[color:var(--color-blue-900)]";
const labelClass =
  "flex flex-col gap-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]";

export function ProductForm({ categories = [], onSubmit, onCancel }: ProductFormProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ name: name.trim(), price: Number(price), category, description: description.trim() });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-md flex-col gap-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-gray-50)] p-[var(--space-5)]"
    >
      <h2 className="text-[length:var(--text-xl)] font-semibold text-[color:var(--color-blue-900)]">상품 등록</h2>

      <label className={labelClass}>
        상품명
        <input
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        가격
        <input
          className={fieldClass}
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>

      <label className={labelClass}>
        카테고리
        <select
          className={fieldClass}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        >
          <option value="" disabled>
            카테고리 선택
          </option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        설명
        <textarea
          className={fieldClass}
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
