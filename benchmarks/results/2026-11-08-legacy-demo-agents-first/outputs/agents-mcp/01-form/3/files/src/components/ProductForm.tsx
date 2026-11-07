import { useState } from "react";
import type { FormEvent } from "react";
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
    if (!values.price.trim() || Number(values.price) < 0 || Number.isNaN(Number(values.price))) {
      next.price = "올바른 가격을 입력해 주세요.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        padding: "var(--space-5)",
        background: "var(--color-gray-50)",
        border: "1px solid var(--color-gray-100)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: "var(--text-xl)", color: "var(--color-blue-900)" }}>상품 등록</h2>

      <Input
        id="product-name"
        label="상품명"
        value={values.name}
        onChange={(e) => set("name")(e.target.value)}
        error={errors.name}
      />
      <Input
        id="product-price"
        label="가격"
        type="number"
        min={0}
        value={values.price}
        onChange={(e) => set("price")(e.target.value)}
        error={errors.price}
      />
      <Select
        label="카테고리"
        options={categories}
        value={values.category}
        onChange={(e) => set("category")(e.target.value)}
      />

      <label style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-gray-500)" }}>
        설명
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description")(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "var(--space-2)",
            padding: "var(--space-3)",
            border: "1px solid var(--color-gray-100)",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-blue-900)",
            resize: "vertical",
          }}
        />
      </label>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
