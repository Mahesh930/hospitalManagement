"use client";

import { useState } from "react";
import Link from "next/link";
import { masterDataApi, MedicineDto } from "@medicore/api";
import { toast } from "sonner";
import { Pill, Plus, Search, Database } from "lucide-react";

export default function MedicinesMasterPage() {
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [dosageForm, setDosageForm] = useState("Tablet");
  const [strength, setStrength] = useState("500mg");
  const [unitPrice, setUnitPrice] = useState<number | "">(10);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !genericName) {
      toast.error("Brand name and generic name are required");
      return;
    }

    setLoading(true);
    try {
      const payload: MedicineDto = {
        name,
        genericName,
        dosageForm,
        strength,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
      };

      await masterDataApi.addMedicine(payload);
      toast.success("Medicine added to Master Catalogue!");
      setName("");
      setGenericName("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to add medicine");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Sub-nav */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Master Data Catalogue</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage medicines, ICD-10 diagnoses, and hospital billing charges</p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-xl">
          <Link href="/master-data/medicines" className="px-3.5 py-1.5 bg-card text-foreground font-semibold text-xs rounded-lg shadow-sm">
            Medicines
          </Link>
          <Link href="/master-data/diagnoses" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Diagnoses
          </Link>
          <Link href="/master-data/charges" className="px-3.5 py-1.5 text-muted-foreground font-medium text-xs hover:text-foreground rounded-lg">
            Charges
          </Link>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" /> Add Medicine Master Entry
        </h2>

        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Brand / Trade Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crocin 500"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
              Generic Molecule Name *
            </label>
            <input
              type="text"
              required
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Form</label>
            <input
              type="text"
              value={dosageForm}
              onChange={(e) => setDosageForm(e.target.value)}
              placeholder="Tablet, Syrup, Injection..."
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">Strength</label>
            <input
              type="text"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              placeholder="500mg, 250mg/5ml..."
              className="w-full px-3.5 py-2 bg-muted/30 border border-input rounded-xl text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? "Saving..." : "Add to Master Catalogue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
