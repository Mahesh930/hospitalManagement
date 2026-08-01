"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { CreditCard, ShieldCheck, CheckCircle2, Zap, ArrowUpRight } from "lucide-react";

const mockPlans = [
  { code: "TRIAL", name: "14-Day Free Trial", price: "₹0", maxDoctors: 3, maxBeds: 10, maxUsers: 5, color: "border-slate-300 dark:border-slate-700" },
  { code: "BASIC", name: "Basic Hospital Tier", price: "₹4,999 / mo", maxDoctors: 10, maxBeds: 30, maxUsers: 15, color: "border-blue-500/40" },
  { code: "STANDARD", name: "Standard Hospital Tier", price: "₹12,999 / mo", maxDoctors: 25, maxBeds: 100, maxUsers: 50, color: "border-emerald-500/40" },
  { code: "ENTERPRISE", name: "Enterprise Multi-Branch", price: "₹34,999 / mo", maxDoctors: 200, maxBeds: 1000, maxUsers: 500, color: "border-purple-500/40" },
];

export default function SubscriptionsPage() {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SaaS Subscription & License Tiers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage platform subscription plans and hospital license seat quotas</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-300 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <CreditCard className="w-4 h-4" />
            <span>SAAS BILLING ENGINE</span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockPlans.map((plan) => (
            <div key={plan.code} className={`bg-card border ${plan.color} rounded-2xl p-5 shadow-sm flex flex-col justify-between`}>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {plan.code}
                </span>
                <h3 className="text-base font-bold text-foreground mt-2">{plan.name}</h3>
                <p className="text-xl font-extrabold text-foreground mt-1">{plan.price}</p>

                <div className="space-y-2 my-4 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Doctors Seat Cap:</span>
                    <strong className="text-foreground">{plan.maxDoctors}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bed Capacity Cap:</span>
                    <strong className="text-foreground">{plan.maxBeds}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Staff Seats:</span>
                    <strong className="text-foreground">{plan.maxUsers}</strong>
                  </div>
                </div>
              </div>

              <button className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-colors">
                Configure Quotas
              </button>
            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
