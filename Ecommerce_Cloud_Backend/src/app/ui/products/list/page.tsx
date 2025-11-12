"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaEdit,
  FaTrash,
  FaStar,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import { toast } from "react-toastify";

type Product = {
  id: string;
  productName: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageURL?: string;
  brand?: string;
  sku?: string;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
  category: { id: string; categoryName: string };
  vendor: {
    id: string;
    vendorName: string;
    region: string;
    isVerified: boolean;
  };
};

type Category = {
  id: string;
  categoryName: string;
};

type FilterChip = {
  label: string;
  onClear: () => void;
};

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory, minPrice, maxPrice]);

  async function loadCategories() {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data?.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategory) params.append("category", selectedCategory);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      params.append("limit", "20");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.data?.products || []);
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted successfully");
        loadProducts();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
  }

  const activeFilters = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (search) chips.push({ label: `Search: "${search}"`, onClear: () => setSearch("") });
    if (selectedCategory) {
      const label = categories.find((cat) => cat.id === selectedCategory)?.categoryName || "Category";
      chips.push({ label: `Category: ${label}`, onClear: () => setSelectedCategory("") });
    }
    if (minPrice) chips.push({ label: `Min GH₵ ${minPrice}`, onClear: () => setMinPrice("") });
    if (maxPrice) chips.push({ label: `Max GH₵ ${maxPrice}`, onClear: () => setMaxPrice("") });
    return chips;
  }, [search, selectedCategory, minPrice, maxPrice, categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[var(--primary)]"></div>
      </div>
    );
  }

  const resultsLabel = products.length === 1 ? "product" : "products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="pill">Product catalogue</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Products</h1>
          <p className="text-sm text-gray-200 font-medium">
            {products.length} {resultsLabel} ready for customers
          </p>
        </div>
        <Link href="/ui/products/new" className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold">
          + Add product
        </Link>
      </div>

      <div className="glass-surface rounded-3xl p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-11 h-11 rounded-lg border-2 border-white/30 bg-white/10 flex items-center justify-center text-gray-300">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search by name, description, brand or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-11 rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 px-4 focus:border-[var(--gold)] focus:bg-white/15 focus:ring-2 focus:ring-[var(--gold)]/30 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-200 hover:border-[var(--gold)]/50 hover:bg-white/10 transition-all"
          >
            <FaFilter /> {showFilters ? "Hide filters" : "More filters"}
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {activeFilters.map((chip) => (
              <button
                key={chip.label}
                onClick={chip.onClear}
                className="rounded-full border border-[var(--gold)]/40 bg-[rgba(244,196,48,0.1)] px-3 py-1 text-[var(--gold)]"
              >
                {chip.label} ×
              </button>
            ))}
            <button onClick={clearFilters} className="text-xs text-gray-300 hover:text-white">
              Clear all filters
            </button>
          </div>
        )}

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/20">
            <div>
              <label className="block text-sm mb-2 text-gray-200 font-semibold">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-xl border-2 border-white/20 bg-white/10 text-white px-4 py-2.5">
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-200 font-semibold">Min price (GH₵)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 px-4 py-2.5"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 text-gray-200 font-semibold">Max price (GH₵)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="10000"
                min="0"
                step="0.01"
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 text-white placeholder-gray-400 px-4 py-2.5"
              />
            </div>
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="glass-surface rounded-3xl p-16 text-center text-gray-300">
          <FiImage className="mx-auto mb-4 text-6xl text-gray-500" />
          <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {search || selectedCategory || minPrice || maxPrice
              ? "Try adjusting your filters"
              : "Add your first product to showcase it here."}
          </p>
          <Link href="/ui/products/new" className="btn-primary inline-flex px-6 py-3 rounded-xl text-sm font-semibold">
            Add product
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="glass-surface rounded-3xl overflow-hidden flex flex-col">
              <div className="relative h-56 bg-[rgba(255,255,255,0.05)]">
                {product.imageURL ? (
                  <Image src={product.imageURL} alt={product.productName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    <FiImage className="text-4xl" />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="pill bg-[rgba(10,155,69,0.2)] text-[var(--primary)]">
                    {product.category.categoryName}
                  </span>
                  {product.vendor.isVerified && (
                    <span className="pill bg-[rgba(244,196,48,0.2)] text-[var(--gold)]">Verified</span>
                  )}
                  {!product.isActive && (
                    <span className="pill bg-[rgba(214,27,41,0.2)] text-[var(--secondary)]">Inactive</span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                      {product.productName}
                    </h3>
                    {product.sku && <span className="text-xs text-gray-500">SKU {product.sku}</span>}
                  </div>
                  <p className="mt-2 text-sm text-gray-300 line-clamp-3">{product.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-[var(--gold)]" />
                    <span>{product.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({product.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FaMapMarkerAlt />
                    <span>{product.vendor.vendorName}</span>
                    <span>•</span>
                    <span>{product.vendor.region}</span>
                  </div>
                </div>

                {product.brand && (
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Brand: {product.brand}</p>
                )}

                <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-[var(--gold)]">
                      GH₵ {product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      Stock: {product.stockQuantity > 0 ? product.stockQuantity : "Out"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/ui/products/${product.id}`}
                      className="btn-primary flex-1 min-w-[140px] px-4 py-2 rounded-xl text-sm font-semibold text-center"
                    >
                      View product
                    </Link>
                    <Link
                      href={`/ui/products/edit/${product.id}`}
                      className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 hover:border-white/30"
                    >
                      <FaEdit className="inline mr-2" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.productName)}
                      className="rounded-xl border border-[var(--secondary)]/40 px-4 py-2 text-sm font-semibold text-[var(--secondary)] hover:border-[var(--secondary)]"
                    >
                      <FaTrash className="inline mr-2" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


