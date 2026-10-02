"use client";

import { useEffect, useState } from "react";
import {
  pharmacyApi,
  PurchaseOrderDto,
  masterDataApi,
  MedicineDto
} from "@medicore/api";
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  Building2,
  FileText
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyPurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrderDto[]>([]);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState<PurchaseOrderDto>({
    supplierName: "Apex Healthcare Distributors",
    supplierContact: "+91 98765 43210",
    orderDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
    totalAmount: 15000,
    itemsJson: "Amoxicillin 500mg (200 units), Paracetamol 650mg (500 units)",
    notes: "Urgent monthly stock replenishment",
  });

  const loadOrders = async () => {
    try {
      setLoading(true);
      const [orderRes, medRes] = await Promise.all([
        pharmacyApi.getPurchaseOrders(),
        masterDataApi.getMedicines()
      ]);
      setOrders(orderRes.data.data);
      setMedicines(medRes.data.data);
    } catch (err: unknown) {
      console.error("Failed to load purchase orders", err);
      toast.error("Could not load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pharmacyApi.createPurchaseOrder(form);
      toast.success("Purchase order successfully created and sent to supplier");
      setModalOpen(false);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create purchase order");
    }
  };

  const handleMarkReceived = async (poId?: string) => {
    if (!poId) return;
    try {
      await pharmacyApi.receivePurchaseOrder(poId);
      toast.success("Purchase order marked as received");
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update purchase order");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Pharmacy Purchase Orders</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Procurement & Receiving
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Create supplier replenishment requests, track delivery schedules, and record goods arrivals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Purchase Order
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">PO Number</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Order Date</th>
                <th className="py-3 px-4 font-semibold">Expected Delivery</th>
                <th className="py-3 px-4 font-semibold">Total Value</th>
                <th className="py-3 px-4 font-semibold">Items Requested</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-muted/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">{po.poNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{po.supplierName}</p>
                      <p className="text-[11px] text-muted-foreground">{po.supplierContact}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{po.orderDate}</td>
                    <td className="py-3 px-4 text-muted-foreground">{po.expectedDeliveryDate || "—"}</td>
                    <td className="py-3 px-4 font-bold text-foreground">₹{po.totalAmount?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={po.itemsJson}>
                      {po.itemsJson || "Batch order"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          po.status === "RECEIVED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {po.status !== "RECEIVED" && (
                        <button
                          onClick={() => handleMarkReceived(po.id)}
                          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                        >
                          Mark Received
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Create Purchase Replenishment Order</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={form.supplierName}
                  onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Contact Details</label>
                  <input
                    type="text"
                    value={form.supplierContact}
                    onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={form.expectedDeliveryDate}
                    onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Items & Quantities Description</label>
                <textarea
                  rows={3}
                  required
                  value={form.itemsJson}
                  onChange={(e) => setForm({ ...form, itemsJson: e.target.value })}
                  placeholder="e.g. Amoxicillin 500mg (100 boxes), Metformin 500mg (200 strips)"
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Estimated Purchase Value (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Order Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
