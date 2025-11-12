"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { FaImage, FaUpload } from "react-icons/fa";
import { FiX } from "react-icons/fi";

type Category = { id: string; categoryName: string };
type Vendor = { id: string; vendorName: string; region: string; isVerified: boolean };

type ProductDetail = {
  id: string;
  productName: string;
  description: string;
  price: number;
  stockQuantity: number;
  categoryId: string;
  vendorId: string;
  imageURL?: string | null;
  galleryImages: string[];
  highlights: string[];
  deliveryInfo?: string | null;
  returnPolicy?: string | null;
  videoURL?: string | null;
  sku?: string | null;
  brand?: string | null;
  weight?: number | null;
  isActive: boolean;
};

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

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      if (!id) return;
      setLoading(true);
      try {
        const [productRes, categoriesRes, vendorsRes] = await Promise.all([
          fetch(`/api/products/${id}`),
          fetch("/api/categories"),
          fetch("/api/vendors"),
        ]);

        if (!productRes.ok) {
          toast.error("Product not found");
          router.push("/ui/products/list");
          return;
        }

        const productData = await productRes.json();
        const product: ProductDetail | undefined = productData.data?.product;
        if (!product) {
          toast.error("Product not found");
          router.push("/ui/products/list");
          return;
        }

        setForm({
          productName: product.productName,
          description: product.description,
          price: product.price.toString(),
          stockQuantity: product.stockQuantity.toString(),
          categoryId: product.categoryId,
          vendorId: product.vendorId,
          sku: product.sku || "",
          brand: product.brand || "",
          weight: product.weight ? product.weight.toString() : "",
          deliveryInfo: product.deliveryInfo || "",
          returnPolicy: product.returnPolicy || "",
          videoURL: product.videoURL || "",
          isActive: product.isActive,
        });
        setPrimaryImage(product.imageURL || "");
        setGalleryImages(product.galleryImages || []);
        setHighlightsText((product.highlights || []).join("\n"));

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.data?.categories || []);
        }

        if (vendorsRes.ok) {
          const data = await vendorsRes.json();
          setVendors(data.data?.vendors || []);
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to load product");
        router.push("/ui/products/list");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, router]);

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
    if (!id) return;
    setSaving(true);

    try {
      const highlightList = highlightsText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          description: form.description,
          price: form.price,
          stockQuantity: form.stockQuantity,
          categoryId: form.categoryId,
          imageURL: primaryImage || null,
          galleryImages,
          sku: form.sku,
          brand: form.brand,
          weight: form.weight,
          isActive: form.isActive,
          highlights: highlightList,
          deliveryInfo: form.deliveryInfo,
          returnPolicy: form.returnPolicy,
          videoURL: form.videoURL,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update product");
      }

      toast.success("Product updated successfully!");
      router.push("/ui/products/list");
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="pill">Edit product</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Update product details</h1>
          <p className="text-sm text-gray-300">Make changes to pricing, availability or imagery.</p>
        </div>
        <Link href="/ui/products/list" className="text-sm font-semibold text-gray-300 hover:text-white">
          ← Back to products
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.8fr]">
        <form onSubmit={handleSubmit} className="glass-surface rounded-3xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Product name *</label>
              <input
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Brand</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Price (GH₵) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Stock quantity *</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                min="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Category *</label>
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
            </div>
            <div>
              <label className="block text-sm mb-1">Vendor</label>
              <select
                value={form.vendorId}
                onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
                className="w-full"
                style={{ appearance: 'auto' }}
              >
                <option value="">-- Keep current vendor --</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName} ({vendor.region}) {vendor.isVerified ? "✓" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Leave unchanged to keep current vendor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">SKU</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Weight (kg)</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm mb-1">Primary image</label>
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-gray-300 cursor-pointer hover:border-white/40">
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
                <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/10">
                  <img src={primaryImage} alt="Primary preview" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 text-gray-500">
                  <FaImage className="text-3xl" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm mb-1">Gallery images</label>
              <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-6 text-sm text-gray-300 cursor-pointer hover:border-white/40">
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
                    <div key={image} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
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
            <label className="block text-sm mb-1">Highlights (one per line)</label>
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Delivery information</label>
              <textarea
                value={form.deliveryInfo}
                onChange={(e) => setForm({ ...form, deliveryInfo: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Return policy</label>
              <textarea
                value={form.returnPolicy}
                onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Product video URL</label>
            <input
              value={form.videoURL}
              onChange={(e) => setForm({ ...form, videoURL: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-4 border-t border-white/10 pt-4">
            <label className="flex items-center gap-3 text-sm text-gray-200">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Product is active and visible in the marketplace
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-white/10 pt-6">
            <Link href="/ui/products/list" className="btn-accent px-6 py-3 rounded-xl text-sm font-semibold text-center">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>

        <aside className="glass-surface rounded-3xl p-6 space-y-6 h-fit">
          <h3 className="text-lg font-semibold text-white">Preview</h3>
          <div className="rounded-3xl overflow-hidden border border-white/10">
            <div className="relative h-36 bg-[rgba(16,26,47,0.85)]">
              {primaryImage ? (
                <img src={primaryImage} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Upload an image to preview
                </div>
              )}
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute bottom-4 left-4">
                <h4 className="text-base font-semibold text-white">
                  {form.productName || "Product name"}
                </h4>
                <p className="text-xs text-gray-200">GH₵ {form.price || "0.00"}</p>
              </div>
            </div>
            <div className="p-4 space-y-2 bg-[rgba(7,13,24,0.92)] text-sm text-gray-300">
              <p className="line-clamp-3">{form.description || "Description snippet preview."}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-300">
            <p>Use gallery images and highlights to help customers visualise your product quickly.</p>
            <p className="text-xs text-gray-500">Images are stored as base64 data for the demo experience.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}





