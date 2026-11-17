"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  pharmacyApi,
  MedicineBatchDto,
  StockReceiptDto,
  StockAdjustmentDto,
  masterDataApi,
  MedicineDto
} from "@medicore/api";
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Warehouse,
  ShieldAlert,
  ArrowUpDown,
  Tag,
  Calendar,
  Layers
} from "lucide-react";
import { toast } from "sonner";

export default function PharmacyInventoryPage() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "ALL";

  const [batches, setBatches] = useState<MedicineBatchDto[]>([]);
  const [medicines, setMedicines] = useState<MedicineDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  // Modals
  const [grnModalOpen, setGrnModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<MedicineBatchDto | null>(null);

  // GRN Form State
  const [grnForm, setGrnForm] = useState<StockReceiptDto>({
    medicineId: "",
    batchNumber: "",
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
    quantity: 100,
    purchasePrice: 10,
    mrp: 20,
    sellingPrice: 15,
    storageLocation: "Rack A-01, Bin 2",
    supplierName: "Apex Healthcare Distributors",
    invoiceNumber: "INV-" + Math.floor(100000 + Math.random() * 900000),
    notes: "Supplier receipt",
  });

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = useState<StockAdjustmentDto>({
    batchId: "",
    quantityChange: -1,
    reason: "DAMAGE",
    notes: "Broken seal / bottle leakage",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchRes, medRes] = await Promise.all([
        pharmacyApi.getBatches(),
        masterDataApi.getMedicines()
      ]);
      setBatches(batchRes.data.data);
      setMedicines(medRes.data.data);
      if (medRes.data.data.length > 0 && !grnForm.medicineId && medRes.data.data[0].id) {
        setGrnForm((prev) => ({ ...prev, medicineId: medRes.data.data[0].id! }));
      }
    } catch (err: unknown) {
      console.error("Failed to load inventory data", err);
      toast.error("Could not load pharmacy inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        b.medicineName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        (b.storageLocation && b.storageLocation.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === "lowStock") return b.quantityOnHand <= 25;
      if (statusFilter === "nearExpiry") return b.daysUntilExpiry !== undefined && b.daysUntilExpiry <= 60;
      if (statusFilter === "quarantined") return b.status === "QUARANTINED" || b.status === "RECALLED";
      return true;
    });
  }, [batches, searchQuery, statusFilter]);

  const handleCreateGRN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnForm.medicineId || !grnForm.batchNumber || grnForm.quantity <= 0) {
      toast.error("Please fill required fields (Medicine, Batch No, Quantity > 0)");
      return;
    }
    try {
      await pharmacyApi.addStockReceipt(grnForm);
      toast.success(`Successfully received ${grnForm.quantity} units for Batch ${grnForm.batchNumber}`);
      setGrnModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to record stock receipt");
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.batchId || adjustForm.quantityChange === 0) {
      toast.error("Please provide valid batch and non-zero quantity change");
      return;
    }
    try {
      await pharmacyApi.adjustStock(adjustForm);
      toast.success("Stock adjustment successfully applied");
      setAdjustModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust stock");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Stock & Batch Inventory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              FEFO Tracked
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track pharmaceutical batches, storage locations (racks/bins), expiry timelines, and stock adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition border border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setGrnModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Stock Receipt (GRN)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm">
        {/* Quick filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: "All Batches" },
            { id: "lowStock", label: "Low Stock (<25)" },
            { id: "nearExpiry", label: "Near Expiry (<60d)" },
            { id: "quarantined", label: "Quarantined / Recalled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === f.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search medicine, batch or rack location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground">
              <tr>
                <th className="py-3 px-4 font-semibold">Medicine & Generic</th>
                <th className="py-3 px-4 font-semibold">Batch No</th>
                <th className="py-3 px-4 font-semibold">Expiry Date</th>
                <th className="py-3 px-4 font-semibold">Storage Location</th>
                <th className="py-3 px-4 font-semibold">Stock on Hand</th>
                <th className="py-3 px-4 font-semibold">Quarantined</th>
                <th className="py-3 px-4 font-semibold">Selling Price</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading inventory batches...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No medicine batches found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const isNearExpiry = b.daysUntilExpiry !== undefined && b.daysUntilExpiry <= 60;
                  const isExpired = b.daysUntilExpiry !== undefined && b.daysUntilExpiry <= 0;
                  const isLowStock = b.quantityOnHand <= 25;

                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-foreground">{b.medicineName}</p>
                        <p className="text-[11px] text-muted-foreground">{b.genericName} • {b.dosageForm} {b.strength}</p>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">{b.batchNumber}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isExpired
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : isNearExpiry
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {b.expiryDate} {b.daysUntilExpiry !== undefined && `(${b.daysUntilExpiry}d)`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Warehouse className="w-3.5 h-3.5 text-primary" />
                          {b.storageLocation || "General Rack"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold text-sm ${
                            b.quantityOnHand === 0
                              ? "text-muted-foreground"
                              : isLowStock
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {b.quantityOnHand} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {b.quarantinedQuantity || 0}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">₹{b.sellingPrice?.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            b.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : b.status === "NEAR_EXPIRY"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedBatch(b);
                            setAdjustForm({
                              batchId: b.id,
                              quantityChange: -1,
                              reason: "DAMAGE",
                              notes: "Audit adjustment",
                            });
                            setAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted hover:bg-muted/80 text-foreground border border-border"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Receipt Modal (GRN) */}
      {grnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-foreground">Stock Receipt (GRN)</h3>
              </div>
              <button onClick={() => setGrnModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGRN} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Select Medicine *</label>
                <select
                  value={grnForm.medicineId}
                  onChange={(e) => setGrnForm({ ...grnForm, medicineId: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  required
                >
                  <option value="">-- Choose Medicine --</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={grnForm.batchNumber}
                    onChange={(e) => setGrnForm({ ...grnForm, batchNumber: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl font-mono text-foreground"
                    placeholder="e.g. B-2026-X1"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={grnForm.expiryDate}
                    onChange={(e) => setGrnForm({ ...grnForm, expiryDate: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={grnForm.quantity}
                    onChange={(e) => setGrnForm({ ...grnForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={grnForm.purchasePrice}
                    onChange={(e) => setGrnForm({ ...grnForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={grnForm.sellingPrice}
                    onChange={(e) => setGrnForm({ ...grnForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Storage Location (Rack/Bin)</label>
                  <input
                    type="text"
                    value={grnForm.storageLocation}
                    onChange={(e) => setGrnForm({ ...grnForm, storageLocation: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                    placeholder="Rack A-02, Shelf 3"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={grnForm.supplierName}
                    onChange={(e) => setGrnForm({ ...grnForm, supplierName: e.target.value })}
                    className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                    placeholder="Apex Healthcare"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Supplier Invoice / GRN Ref</label>
                <input
                  type="text"
                  value={grnForm.invoiceNumber}
                  onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setGrnModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Adjust Stock Quantity</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Medicine: <strong>{selectedBatch.medicineName}</strong> (Batch: {selectedBatch.batchNumber})
              <br />
              Current Available Stock: <strong>{selectedBatch.quantityOnHand} units</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Quantity Change (+ or -) *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantityChange}
                  onChange={(e) =>
                    setAdjustForm({ ...adjustForm, quantityChange: parseInt(e.target.value) || 0 })
                  }
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground font-bold"
                  placeholder="-5 or +10"
                />
                <span className="text-[10px] text-muted-foreground">
                  Use negative numbers for damaged/expired write-offs or physical shortages.
                </span>
              </div>

              <div>
                <label className="font-semibold block mb-1">Adjustment Reason *</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                >
                  <option value="DAMAGE">Physical Damage / Broken Seal</option>
                  <option value="EXPIRED">Quarantined Due to Expiry</option>
                  <option value="PHYSICAL_COUNT_VARIANCE">Audit Physical Count Discrepancy</option>
                  <option value="QUARANTINE">Quarantine for Investigation</option>
                  <option value="CORRECTION">Data Entry Correction</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Pharmacist Notes</label>
                <textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full p-2 bg-muted/50 border border-border rounded-xl text-foreground"
                  placeholder="Additional remarks..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
