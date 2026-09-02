"use client";

import type { CalendarCategory } from "@tigilabs/types";

type CategorySelectorProps = {
  categories: CalendarCategory[];
  value?: string;
  onChange: (categoryId: string | undefined) => void;
};

export function CategorySelector({
  categories,
  value,
  onChange,
}: CategorySelectorProps) {
  return (
    <div className="category-selector">
      <button
        type="button"
        className={`category-chip${!value ? " category-chip-active" : ""}`}
        onClick={() => onChange(undefined)}
      >
        Sans categorie
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`category-chip${value === category.id ? " category-chip-active" : ""}`}
          style={{
            borderColor: category.color,
            background:
              value === category.id ? `${category.color}22` : undefined,
          }}
          onClick={() => onChange(category.id)}
        >
          <span
            className="category-dot"
            style={{ background: category.color }}
          />
          {category.name}
        </button>
      ))}
    </div>
  );
}
