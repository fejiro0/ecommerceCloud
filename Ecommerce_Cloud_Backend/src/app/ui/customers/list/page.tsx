"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaTrash, FaSearch, FaMapMarkerAlt, FaUser, FaShoppingBag } from "react-icons/fa";
import { toast } from "react-toastify";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  region: string;
  city: string;
  address: string;
  dateJoined: string;
  isActive: boolean;
  _count?: {
    orders: number;
    reviews: number;
  };
};

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Upper East", "Upper West", "Volta", "Brong-Ahafo",
  "Oti", "Bono East", "Ahafo", "Savannah", "North East", "Western North"
];

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.data?.customers || []);
      }
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Customer deleted successfully");
        loadCustomers();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete customer");
      }
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.firstName.toLowerCase().includes(search.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.phoneNumber.includes(search);

    const matchesRegion = !selectedRegion || customer.region === selectedRegion;

    return matchesSearch && matchesRegion;
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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">{filteredCustomers.length} customers found</p>
        </div>
        <Link
          href="/ui/customers/new"
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          + Add Customer
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 flex items-center gap-2">
            <div className="w-11 h-11 rounded-lg border-2 border-gray-300 bg-gray-50 flex items-center justify-center text-gray-500">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-11 border-2 rounded-lg px-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

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
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No customers found</h3>
          <p className="text-gray-500 mb-6">
            {search || selectedRegion ? "Try adjusting your filters" : "Start by adding your first customer"}
          </p>
          <Link
            href="/ui/customers/new"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Add Customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
            >
              {/* Customer Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-1 text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </h3>
                  {customer.isActive ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/ui/customers/edit/${customer.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaEdit className="text-lg" />
                  </Link>
                  <button
                    onClick={() => handleDelete(customer.id, `${customer.firstName} ${customer.lastName}`)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash className="text-lg" />
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  📧 {customer.email}
                </div>
                <div className="text-sm text-gray-600">
                  📱 {customer.phoneNumber}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  <span>{customer.city}, {customer.region}</span>
                </div>
              </div>

              {/* Stats */}
              {customer._count && (
                <div className="flex gap-4 pt-4 border-t">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <FaShoppingBag className="text-gray-400" />
                    <span>{customer._count.orders} orders</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    ⭐ {customer._count.reviews} reviews
                  </div>
                </div>
              )}

              {/* Join Date */}
              <div className="mt-3 text-xs text-gray-400">
                Joined {new Date(customer.dateJoined).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}







