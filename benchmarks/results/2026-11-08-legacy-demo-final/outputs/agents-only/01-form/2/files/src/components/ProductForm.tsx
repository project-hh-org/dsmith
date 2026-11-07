import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Button } from "./ui/button";

export interface ProductFormValues {
  name: string;
  price: string;
  category: string;
  description: string;
}

export interface ProductFormProps {
  categories?: { value: string; label: string }[];
  initialValues?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-5)",
  background: "var(--color-gray-50)",
  color: "var(--color-blue-900)",
  borderRadius: "var(--radius-sm)",
};

const fieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const labelStyle: CSSProperties = {
  fontSize: "var(--text-xs)",
  color: "var(--color-gray-500)",
};

const inputStyle: CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  background: "var(--color-gray-50)",
  color: "var(--color-blue-900)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "var(--space-2)",
};

const defaultCategories = [
  { value: "", label: "카테고리 선택" },
];

export function ProductForm({ categories = [], initialValues, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: "",
    price: "",
    category: "",
    description: "",
    ...initialValues,
  });

  const set =
    (key: keyof ProductFormValues) =>
    (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <h2 style={titleStyle}>상품 등록</h2>

      <div style={fieldStyle}>
        <label htmlFor="product-name" style={labelStyle}>상품명</label>
        <input
          id="product-name"
          required
          value={values.name}
          onChange={set("name")}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-price" style={labelStyle}>가격</label>
        <input
          id="product-price"
          type="number"
          min={0}
          required
          value={values.price}
          onChange={set("price")}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-category" style={labelStyle}>카테고리</label>
        <select
          id="product-category"
          required
          value={values.category}
          onChange={set("category")}
          style={inputStyle}
        >
          {[...defaultCategories, ...categories].map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-description" style={labelStyle}>설명</label>
        <textarea
          id="product-description"
          rows={4}
          value={values.description}
          onChange={set("description")}
          style={inputStyle}
        />
      </div>

      <div style={actionsStyle}>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
