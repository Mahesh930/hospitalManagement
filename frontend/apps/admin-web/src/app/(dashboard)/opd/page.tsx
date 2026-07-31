"use client";

import Link from "next/link";
import { Stethoscope, ArrowRight, Activity } from "lucide-react";

export default function OpdConsoleListPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">OPD Clinical Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          US-140 &amp; US-141: Clinical encounters, vitals, ICD-10 diagnoses, and drug allergy hard blocker.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Stethoscope className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Active Doctor Consultations</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Select a patient from the Live Doctor Queue to open their OPD consultation console.
        </p>

        <Link
          href="/appointments/queue"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
        >
          <Activity className="w-4 h-4" /> Open Doctor Queue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
