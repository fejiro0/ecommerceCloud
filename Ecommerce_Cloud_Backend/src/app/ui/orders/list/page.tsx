"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEye, FaSearch, FaShoppingBag } from "react-icons/fa";
import { toast } from "react-toastify";

type Order = {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  discountAmount?: number;
  currency: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: Array<{
    quantity: number;
    unitPrice: number;
    product: {
      productName: string;
    };
  }>;
};

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data?.orders || []);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.firstName.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.lastName.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !filterStatus || order.status === filterStatus;

    return matchesSearch && matchesStatus;
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
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Orders</h1>
          <p className="text-gray-200 mt-1 font-medium">{filteredOrders.length} orders found</p>
        </div>
        <Link
          href="/ui/orders/new"
          className="btn-primary px-6 py-3 rounded-lg font-semibold"
        >
          + Create Order
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
              placeholder="Search orders by number or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 h-11 border-2 rounded-lg px-4 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {search || filterStatus ? "Try adjusting your filters" : "No orders have been placed yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-xl text-gray-900">
                      {order.orderNumber}
                    </h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Customer: {order.customer.firstName} {order.customer.lastName} ({order.customer.email})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Order Date: {new Date(order.orderDate).toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/ui/orders/edit/${order.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-semibold flex items-center gap-2"
                >
                  <FaEye /> View Details
                </Link>
              </div>

              {/* Order Items Summary */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {order.orderItems.length} item(s):
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {order.orderItems.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {item.quantity}x {item.product.productName}
                    </span>
                  ))}
                  {order.orderItems.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      +{order.orderItems.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {order.discountAmount && order.discountAmount > 0 && (
                      <span className="text-sm text-gray-500 line-through mr-2">
                        GH₵ {(order.totalAmount + order.discountAmount).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">
                      GH₵ {order.totalAmount.toFixed(2)}
                    </span>
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







