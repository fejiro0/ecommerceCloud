"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaTrash, FaSearch, FaMapMarkerAlt, FaStar, FaCheckCircle, FaTimesCircle, FaStore } from "react-icons/fa";
import { toast } from "react-toastify";

type Vendor = {
  id: string;
  vendorName: string;
  email: string;
  phoneNumber: string;
  businessAddress: string;
  region: string;
  city: string;
  businessLicense?: string;
  taxId?: string;
  joinedDate: string;
  isVerified: boolean;
  isActive: boolean;
  rating?: number;
  _count?: {
    products: number;
  };
};

// Ghana regions
const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono East", "Ahafo", "Savannah", "North East", "Western North"
];

export default function VendorsListPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("all");

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data.data?.vendors || []);
      }
    } catch (error) {
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return;

    try {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Vendor deleted successfully");
        loadVendors();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete vendor");
      }
    } catch (error) {
      toast.error("Failed to delete vendor");
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.email.toLowerCase().includes(search.toLowerCase()) ||
      vendor.phoneNumber.includes(search) ||
      vendor.city.toLowerCase().includes(search.toLowerCase());

    const matchesRegion = !selectedRegion || vendor.region === selectedRegion;

    const matchesVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" && vendor.isVerified) ||
      (filterVerified === "unverified" && !vendor.isVerified);

    return matchesSearch && matchesRegion && matchesVerified;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600 mt-1">{filteredVendors.length} vendors found</p>
        </div>
        <Link
          href="/ui/vendors/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          + Add Vendor
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 flex items-center gap-2">
            <div className="w-11 h-11 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-11 border-2 rounded-lg px-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Regions</option>
              {GHANA_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Filter */}
          <div>
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Vendors</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendors found</h3>
          <p className="text-gray-500 mb-6">
            {search || selectedRegion || filterVerified !== "all"
              ? "Try adjusting your filters"
              : "Start by adding your first vendor"}
          </p>
          <Link
            href="/ui/vendors/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Add Vendor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
            >
              {/* Vendor Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-gray-900 flex items-center gap-2">
                    {vendor.vendorName}
                    {vendor.isVerified && (
                      <FaCheckCircle className="text-green-600 text-lg" title="Verified" />
                    )}
                  </h3>
                  {vendor.rating && (
                    <div className="flex items-center gap-1 text-yellow-500 mb-2">
                      <FaStar />
                      <span className="text-sm text-gray-700">{vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/ui/vendors/edit/${vendor.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit className="text-lg" />
                  </Link>
                  <button
                    onClick={() => handleDelete(vendor.id, vendor.vendorName)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2 mb-4">
                {vendor.isVerified ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Pending Verification
                  </span>
                )}
                {vendor.isActive ? (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  <span>{vendor.city}, {vendor.region}</span>
                </div>
                <div className="text-sm text-gray-600">
                  📧 {vendor.email}
                </div>
                <div className="text-sm text-gray-600">
                  📱 {vendor.phoneNumber}
                </div>
              </div>

              {/* Business Info */}
              {vendor.businessLicense && (
                <div className="text-xs text-gray-500 mb-2">
                  License: {vendor.businessLicense}
                </div>
              )}

              {/* Products Count */}
              {vendor._count && (
                <div className="pt-4 border-t">
                  <span className="text-sm text-gray-500">
                    {vendor._count.products} products
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/ui/products/list?vendor=${vendor.id}`}
                  className="flex-1 text-center bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition text-sm font-semibold"
                >
                  View Products
                </Link>
              </div>

              {/* Join Date */}
              <div className="mt-3 text-xs text-gray-400">
                Joined {new Date(vendor.joinedDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}







