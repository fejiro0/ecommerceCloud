"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaTrash, FaSearch, FaTags } from "react-icons/fa";
import { toast } from "react-toastify";

type Category = {
  id: string;
  categoryName: string;
  description?: string;
  _count?: {
    products: number;
  };
};

export default function CategoriesListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data?.categories || []);
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted successfully");
        loadCategories();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    }
  }

  const filteredCategories = categories.filter((cat) =>
    cat.categoryName.toLowerCase().includes(search.toLowerCase()) ||
    cat.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">{filteredCategories.length} categories found</p>
        </div>
        <Link
          href="/ui/categories/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          + Add Category
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
            <FaSearch />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 h-11 border-2 rounded-lg px-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FaTags className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No categories found</h3>
          <p className="text-gray-500 mb-6">
            {search ? "Try adjusting your search" : "Start by adding your first category"}
          </p>
          <Link
            href="/ui/categories/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Add Category
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">
                  {getCategoryIcon(category.categoryName)}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/ui/categories/edit/${category.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit className="text-lg" />
                  </Link>
                  <button
                    onClick={() => handleDelete(category.id, category.categoryName)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2 text-gray-900">
                {category.categoryName}
              </h3>

              {category.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {category.description}
                </p>
              )}

              {category._count && (
                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {category._count.products} products
                  </span>
                </div>
              )}

              <Link
                href={`/ui/products/list?category=${category.id}`}
                className="block mt-4 text-center bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition text-sm font-semibold"
              >
                View Products
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get category icons
function getCategoryIcon(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("electronic") || name.includes("phone") || name.includes("computer")) return "📱";
  if (name.includes("fashion") || name.includes("clothing") || name.includes("cloth")) return "👔";
  if (name.includes("food") || name.includes("grocery")) return "🍎";
  if (name.includes("home") || name.includes("furniture")) return "🏠";
  if (name.includes("beauty") || name.includes("cosmetic")) return "💄";
  if (name.includes("sport") || name.includes("fitness")) return "⚽";
  if (name.includes("book") || name.includes("education")) return "📚";
  if (name.includes("toy") || name.includes("kid")) return "🧸";
  if (name.includes("health") || name.includes("medical")) return "⚕️";
  if (name.includes("automotive") || name.includes("car")) return "🚗";
  return "🏷️";
}







