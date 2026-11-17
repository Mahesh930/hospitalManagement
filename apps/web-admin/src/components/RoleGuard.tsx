"use client";

import { useAuthStore } from "@/store/auth-store";
import { ShieldAlert } from "lucide-react";
import React from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const roles = useAuthStore((s) => s.roles);

  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground tracking-tight">
          Access Restricted
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          You do not have permission to view this module. Required roles:{" "}
          <span className="font-semibold text-foreground">
            {allowedRoles.join(", ")}
          </span>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
