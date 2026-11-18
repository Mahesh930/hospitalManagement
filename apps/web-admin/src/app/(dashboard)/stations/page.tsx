"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rolesApi, RoleCatalogItemDto } from "@medicore/api";
import { RoleGuard } from "@/components/RoleGuard";

export default function RoleCatalogPage() {
  const [roles, setRoles] = useState<RoleCatalogItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rolesApi
      .getCatalog()
      .then((res) => setRoles(res.data?.data || []))
      .catch(() => setRoles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN", "ADMIN", "HR_ADMIN"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HIS Role Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {roles.length || 21} system roles for multi-specialty hospital operations
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading roles…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3">Demo user</th>
                  <th className="px-4 py-3">Seeded</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.role} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div>{role.displayName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{role.role}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{role.category}</td>
                    <td className="px-4 py-3">
                      <Link href={role.stationPath} className="text-primary hover:underline text-xs font-medium">
                        {role.stationPath}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{role.demoUsername || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${role.seeded ? "text-emerald-600" : "text-amber-600"}`}>
                        {role.seeded ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
