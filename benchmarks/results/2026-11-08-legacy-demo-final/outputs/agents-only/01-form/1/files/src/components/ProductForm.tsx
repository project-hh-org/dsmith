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

const defaultCategories = [
  { value: "fashion", label: "패션" },
  { value: "electronics", label: "전자기기" },
  { value: "food", label: "식품" },
  { value: "etc", label: "기타" },
];

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
  padding: "var(--space-5)",
  background: "var(--color-gray-50)",
  border: "1px solid var(--color-gray-100)",
  borderRadius: "var(--radius-sm)",
  color: "var(--color-blue-900)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-xl)",
  fontWeight: 600,
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
  background: "#fff",
  color: "var(--color-blue-900)",
  font: "inherit",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "var(--space-2)",
};

export function ProductForm({
  categories = defaultCategories,
  initialValues,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initialValues?.name ?? "",
    price: initialValues?.price ?? "",
    category: initialValues?.category ?? "",
    description: initialValues?.description ?? "",
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
    <form style={formStyle} onSubmit={handleSubmit}>
      <h2 style={titleStyle}>상품 등록</h2>

      <div style={fieldStyle}>
        <label htmlFor="product-name" style={labelStyle}>상품명</label>
        <input
          id="product-name"
          style={inputStyle}
          value={values.name}
          onChange={set("name")}
          placeholder="상품명을 입력하세요"
          required
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-price" style={labelStyle}>가격</label>
        <input
          id="product-price"
          style={inputStyle}
          type="number"
          min={0}
          value={values.price}
          onChange={set("price")}
          placeholder="0"
          required
        />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-category" style={labelStyle}>카테고리</label>
        <select
          id="product-category"
          style={inputStyle}
          value={values.category}
          onChange={set("category")}
          required
        >
          <option value="" disabled>카테고리를 선택하세요</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <label htmlFor="product-description" style={labelStyle}>설명</label>
        <textarea
          id="product-description"
          style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
          value={values.description}
          onChange={set("description")}
          placeholder="상품 설명을 입력하세요"
        />
      </div>

      <div style={actionsStyle}>
        <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
        <Button type="submit">저장</Button>
      </div>
    </form>
  );
}
