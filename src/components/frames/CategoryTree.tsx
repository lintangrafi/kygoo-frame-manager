"use client";

import { useState, useEffect } from "react";
import { FolderTree, Plus, ChevronRight, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
}

export function CategoryTree({
  onSelect,
  selectedId,
}: {
  onSelect?: (cat: Category) => void;
  selectedId?: string | null;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/frame-categories")
      .then((r) => r.json())
      .then((data) => {
        // Build tree from flat list
        const map = new Map<string, Category>();
        data.forEach((c: Category) => map.set(c.id, { ...c, children: [] }));
        const roots: Category[] = [];
        data.forEach((c: Category) => {
          if (c.parentId) {
            const parent = map.get(c.parentId);
            if (parent) parent.children = parent.children || [];
            parent?.children?.push({ ...c });
          } else {
            roots.push({ ...c });
          }
        });
        setCategories(roots);
      });
  }, []);

  function renderNode(node: Category, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const isSelected = selectedId === node.id;

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            onSelect?.(node);
            if (hasChildren) {
              setExpanded((prev) => {
                const next = new Set(prev);
                isExpanded ? next.delete(node.id) : next.add(node.id);
                return next;
              });
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
            isSelected
              ? "bg-amber/10 text-amber border border-amber/20"
              : "text-mahogany/60 hover:bg-cream hover:text-mahogany"
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )
          ) : (
            <span className="w-3" />
          )}
          <span className="text-[10px]">{node.icon}</span>
          <span>{node.name}</span>
        </button>
        {isExpanded &&
          hasChildren &&
          node.children!.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="bg-cream-card rounded-2xl border border-amber/5 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-mahogany/50 uppercase tracking-wider flex items-center gap-1.5">
          <FolderTree className="w-3 h-3" />
          Kategori Frame
        </span>
      </div>
      {categories.length === 0 ? (
        <p className="text-[11px] text-mahogany/30 text-center py-4">
          Belum ada kategori. Buat kategori baru untuk mengelompokkan frame.
        </p>
      ) : (
        <div className="space-y-0.5">
          {categories.map((cat) => renderNode(cat))}
        </div>
      )}
    </div>
  );
}

export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/frame-categories")
      .then((r) => r.json())
      .then((data) => {
        // Only roots for select
        setCategories(data.filter((c: Category) => !c.parentId));
      });
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-cream border-2 border-amber/10 rounded-xl px-3 py-2.5 text-sm text-espresso focus:outline-none focus:border-amber focus:ring-4 focus:ring-amber/5 transition-all"
    >
      <option value="">Pilih Kategori...</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.slug}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}