"use client";

import { useState } from "react";
import Link from "next/link";
import { patientsApi, PatientDto } from "@medicore/api";
import { Search, UserPlus, Phone, AlertTriangle, ChevronRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a name, UHID, or phone number");
      return;
    }
    setLoading(true);
    try {
      const res = await patientsApi.search(searchQuery);
      setPatients(res.data.data || []);
      if ((res.data.data || []).length === 0) {
        toast.info("No patients found matching query.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search existing patients or register new admissions.
          </p>
        </div>
        <Link
          href="/patients/register"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          New Patient Registration
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Patient Name, UHID, or 10-digit Phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-secondary/80 transition-all disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* Results Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">
          <span>Search Results ({patients.length})</span>
          <span className="text-xs text-muted-foreground">Showing server-side matches</span>
        </div>

        {patients.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No patients retrieved yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the search bar above or click &quot;New Patient Registration&quot; to add a patient.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="p-4 hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {patient.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm">{patient.name}</h3>
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-mono">
                        {patient.uhid || "UHID-PENDING"}
                      </span>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <span className="px-2 py-0.5 bg-allergy/10 text-allergy text-xs rounded-full font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {patient.allergies.length} Allergies
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <span>{patient.gender || "N/A"}, {patient.age ? `${patient.age} yrs` : "N/A"}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      <span>Blood: {patient.bloodGroup || "Unknown"}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/patients/${patient.id}`}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
