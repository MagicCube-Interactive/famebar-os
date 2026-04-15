'use client';

import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { createSafeClient } from '@/lib/supabase/safe-client';
import { ShoppingBag, DollarSign, TrendingUp, CalendarDays, Loader2 } from 'lucide-react';

interface OrderRecord {
  id: string;
  ambassador_code: string;
  ambassador_id: string;
  total: number;
  subtotal: number;
  payment_status: string;
  settlement_status: string;
  items: Array<{
    quantity: number;
    productName?: string;
    product_name?: string;
    paymentMethod?: string;
    customerName?: string | null;
  }>;
  created_at: string;
}

export default function CustomersPage() {
  const { user, role } = useAuthContext();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== 'ambassador' && role !== 'admin') return;

    const fetchOrders = async () => {
      const safeSupa = createSafeClient();
      const userId = user.id;

      const { data: ordersData } = await safeSupa
        .from('orders')
        .select('*')
        .eq('ambassador_id', userId)
        .order('created_at', { ascending: false });

      if (ordersData) {
        setOrders(ordersData as OrderRecord[]);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [user, role]);

  if (!user || role !== 'ambassador' && role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Computed stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthOrders = orders.filter(
    (o) => new Date(o.created_at) >= startOfMonth
  ).length;

  /**
   * Extract total units from the items array.
   * Handles both possible shapes: items could be an array of objects with quantity,
   * or the column might be empty/null.
   */
  function getUnits(items: OrderRecord['items']): number {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  /** Friendly label for payment method */
  function formatPaymentMethod(method: string | null): string {
    if (!method) return '\u2014';
    const map: Record<string, string> = {
      cash: 'Cash',
      zelle: 'Zelle',
      venmo: 'Venmo',
    };
    return map[method.toLowerCase()] || method;
  }

  function getPaymentMethod(order: OrderRecord): string | null {
    return order.items?.[0]?.paymentMethod || null;
  }

  function getCustomerName(order: OrderRecord): string {
    return order.items?.[0]?.customerName || 'Walk-in';
  }

  /** Badge color for payment status */
  function statusBadge(status: string) {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-fuchsia-500/20 text-fuchsia-400';
      case 'refunded':
        return 'bg-red-500/20 text-red-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Your Orders</h1>
        <p className="mt-2 text-on-surface-variant">
          Sales recorded using your referral code
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-tertiary/20 bg-surface-container-low p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-tertiary" />
            <p className="text-xs text-gray-500">Total Orders</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-tertiary">{totalOrders}</p>
          <p className="mt-1 text-xs text-tertiary">all time</p>
        </div>
        <div className="rounded-lg border border-secondary/20 bg-surface-container-low p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-secondary" />
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-secondary">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-secondary">lifetime</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-surface-container-low p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-fixed-dim" />
            <p className="text-xs text-gray-500">Avg Order Value</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-primary-fixed-dim">
            ${averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-primary">per order</p>
        </div>
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-on-surface-variant" />
            <p className="text-xs text-gray-500">This Month</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-on-surface">{thisMonthOrders}</p>
          <p className="mt-1 text-xs text-on-surface-variant">orders this month</p>
        </div>
      </div>

      {/* Orders Table or Empty State */}
      {orders.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-12 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-on-surface-variant/40" />
          <h3 className="mt-4 text-lg font-semibold text-on-surface">
            No Orders Yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
            No sales have been recorded using your referral code yet. Ask your
            admin to record orders with your code, or share it with customers so
            sales are attributed to you.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-outline-variant/10 bg-surface-container-low">
          <div className="border-b border-outline-variant/10 bg-surface-container px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-on-surface">
              <ShoppingBag className="h-5 w-5 text-primary-fixed-dim" />
              Order History ({totalOrders})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container">
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-on-surface-variant">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-on-surface-variant">
                    Units
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-on-surface-variant">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-on-surface-variant">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-on-surface-variant">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-outline-variant/10 transition-all hover:bg-surface-container-low"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm text-on-surface">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-on-surface">
                        {getCustomerName(order)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-on-surface">
                        {getUnits(order.items)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-on-surface">
                        ${(order.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-on-surface-variant">
                        {formatPaymentMethod(getPaymentMethod(order))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusBadge(order.payment_status)}`}
                      >
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
