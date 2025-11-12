"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { FaImage, FaUpload } from "react-icons/fa";
import { FiX } from "react-icons/fi";

type Category = { id: string; categoryName: string };
type Vendor = { id: string; vendorName: string; region: string; isVerified: boolean };

type ProductForm = {
  productName: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  vendorId: string;
  sku: string;
  brand: string;
  weight: string;
  deliveryInfo: string;
  returnPolicy: string;
  videoURL: string;
  isActive: boolean;
};

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [primaryImage, setPrimaryImage] = useState<string>("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [highlightsText, setHighlightsText] = useState<string>("");

  const [form, setForm] = useState<ProductForm>({
    productName: "",
    description: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
    vendorId: "",
    sku: "",
    brand: "",
    weight: "",
    deliveryInfo: "",
    returnPolicy: "",
    videoURL: "",
    isActive: true,
  });

  useEffect(() => {
    async function load() {
      try {
        const [categoriesRes, vendorsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/vendors"),
        ]);

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.data?.categories || []);
        }

        if (vendorsRes.ok) {
          const data = await vendorsRes.json();
          setVendors(data.data?.vendors || []);
        }
      } catch (error) {
        toast.error("Failed to load data");
      }
    }
    load();
  }, []);

  async function readFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePrimaryImageUpload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image")) {
      toast.error("Please upload an image file");
      return;
    }
    const data = await readFile(file);
    setPrimaryImage(data);
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).slice(0, 6);
    const dataUrls = await Promise.all(incoming.map(readFile));
    setGalleryImages((prev) => [...prev, ...dataUrls]);
  }

  function removeGalleryImage(image: string) {
    setGalleryImages((prev) => prev.filter((item) => item !== image));
  }

  const allGallery = useMemo(() => {
    if (primaryImage) {
      return [primaryImage, ...galleryImages.filter((img) => img !== primaryImage)];
    }
    return galleryImages;
  }, [primaryImage, galleryImages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const highlightList = highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          description: form.description,
          price: form.price, // Send as string, API will parse
          stockQuantity: form.stockQuantity, // Send as string, API will parse
          categoryId: form.categoryId,
          vendorId: form.vendorId || undefined, // Optional - will be auto-assigned on backend
          imageURL: primaryImage || undefined,
          galleryImages,
          sku: form.sku || undefined,
          brand: form.brand || undefined,
          weight: form.weight || undefined, // Send as string, API will parse
          isActive: form.isActive,
          highlights: highlightList,
          deliveryInfo: form.deliveryInfo || undefined,
          returnPolicy: form.returnPolicy || undefined,
          videoURL: form.videoURL || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to create product");
      }

      toast.success("Product created successfully!");
      router.push("/ui/products/list");
    } catch (error: any) {
      console.error("Product creation error:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="pill">Create product</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Add new product</h1>
          <p className="text-sm text-gray-600">
            Provide key details, images and availability info for your listing.
          </p>
        </div>
        <Link href="/ui/products/list" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
          ← Back to products
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 space-y-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Product name *</label>
              <input
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="e.g., MTN Turbo Router"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Brand</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Price (GH₵) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Stock quantity *</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-900 font-semibold">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tell customers what they need to know..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
                className="w-full"
                style={{ appearance: 'auto' }}
              >
                <option value="">-- Select a category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No categories found. <Link href="/ui/categories/new" className="underline">Create one</Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">SKU</label>
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="Optional product code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Weight (kg)</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Vendor</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                className="w-full"
                style={{ appearance: 'auto' }}
              >
                <option value="">-- Auto-assign to me --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName} ({vendor.region}) {vendor.isVerified ? "✓" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-assign to your vendor account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Primary image</label>
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 cursor-pointer hover:border-gray-400 bg-white">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) await handlePrimaryImageUpload(file);
                  }}
                />
                <FaUpload /> {primaryImage ? "Change image" : "Upload image"}
              </label>
              {primaryImage ? (
                <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <img src={primaryImage} alt="Primary preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-gray-500 bg-white">
                  <FaImage className="text-3xl" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Gallery images</label>
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 cursor-pointer hover:border-gray-400 bg-white">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleGalleryUpload(e.target.files)}
                />
                <FaUpload /> Add gallery images
              </label>
              {galleryImages.length > 0 && (
                <div className="flex gap-3 overflow-x-auto">
                  {galleryImages.map((image) => (
                    <div key={image} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <img src={image} alt="Gallery" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white"
                        onClick={() => removeGalleryImage(image)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-900 font-semibold">Highlights (one per line)</label>
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              placeholder={"Long battery life\nFree nationwide delivery"}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Delivery information</label>
              <textarea
                value={form.deliveryInfo}
                onChange={(e) => setForm({ ...form, deliveryInfo: e.target.value })}
                placeholder="Delivered in 2-3 working days across Ghana"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-gray-900 font-semibold">Return policy</label>
              <textarea
                value={form.returnPolicy}
                onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                placeholder="Returns accepted within 7 days if unused"
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-900 font-semibold">Product video URL</label>
            <input
              value={form.videoURL}
              onChange={(e) => setForm({ ...form, videoURL: e.target.value })}
              placeholder="Optional promotional video"
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Product is active and visible in the marketplace
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200 pt-6">
            <Link href="/ui/products/list" className="px-6 py-3 rounded-xl text-sm font-semibold text-center border-2 border-gray-200 hover:bg-gray-50 text-gray-800">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? "Creating..." : "Create product"}
            </button>
          </div>
        </form>

        <aside className="rounded-3xl p-6 space-y-6 h-fit border border-gray-200 bg-white shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <div className="rounded-3xl overflow-hidden border border-gray-200 bg-white">
            <div className="relative h-36 bg-gray-100">
              {primaryImage ? (
                <img src={primaryImage} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Upload an image to preview
                </div>
              )}
              <div className="absolute inset-0" />
              <div className="absolute bottom-4 left-4">
                <h4 className="text-base font-semibold text-gray-900">
                  {form.productName || "Product name"}
                </h4>
                <p className="text-xs text-gray-600">{form.brand || "Brand"}</p>
              </div>
            </div>
            <div className="p-4 space-y-2 bg-white text-sm text-gray-700">
              <p className="line-clamp-3">{form.description || "Description snippet preview."}</p>
              <p className="text-[var(--gold)] font-semibold">GH₵ {form.price || "0.00"}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-700">
            <p>Highlights, delivery info and gallery images will help customers compare and choose faster.</p>
            <p className="text-xs text-gray-500">Images are stored in base64 for this demo. Swap to cloud storage before production.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}





