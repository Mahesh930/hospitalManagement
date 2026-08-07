"use client";

/**
 * Patient Registry Page Component for MediCore ERP.
 * 
 * Logic Overview:
 * 1. Automatic Loading: Uses `useEffect` hook to fetch and render all registered patients on initial page mount.
 * 2. Real-Time & Server Search: Supports server-side search across Patient Name, UHID, or 10-digit Phone number.
 * 3. Clinical Alerts: Displays allergy safety badge counts for patients with recorded drug allergies.
 * 4. Patient Navigation: Direct links to view individual patient profiles and medical histories.
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { patientsApi, PatientDto } from "@medicore/api";
import { Search, UserPlus, Phone, ChevronRight, ShieldAlert, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientDto[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches patients from backend API. If query is empty, fetches all active registered patients.
   */
  const loadPatients = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await patientsApi.search(query);
      setPatients(res.data.data || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error?.response?.data?.error?.message || "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all patients automatically on page load
  useEffect(() => {
    loadPatients("");
  }, [loadPatients]);

  /**
   * Handles submission of patient search query.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients(searchQuery);
  };

  /**
   * Resets search query and reloads all registered patients.
   */
  const handleResetSearch = () => {
    setSearchQuery("");
    loadPatients("");
  };

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Patient Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all registered hospital patients or perform a targeted search.
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

      {/* Search Bar & Reset */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
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
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              {loading ? "Searching..." : "Search"}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-3.5 py-2.5 bg-muted text-muted-foreground hover:text-foreground font-medium text-sm rounded-xl transition-all"
                title="Reset Search"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Patients List Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between">
          <span>Registered Patients ({patients.length})</span>
          <span className="text-xs text-muted-foreground">Server-side synchronized</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm font-medium">Loading patient records...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No registered patients found.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;New Patient Registration&quot; to add a new patient.
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{patient.name}</h3>
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-mono font-bold">
                        {patient.uhid || "UHID-PENDING"}
                      </span>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs rounded-full font-semibold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          {patient.allergies.length} Allergies
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>{patient.gender || "N/A"}, {patient.age ? `${patient.age} yrs` : "N/A"}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      {patient.email && <span>{patient.email}</span>}
                      <span>Blood Group: <strong className="text-foreground">{patient.bloodGroup || "N/A"}</strong></span>
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
