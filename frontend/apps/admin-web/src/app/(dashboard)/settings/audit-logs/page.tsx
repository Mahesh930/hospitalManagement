"use client";

import { RoleGuard } from "@/components/RoleGuard";
import { FileSpreadsheet, Shield } from "lucide-react";

const mockAuditLogs = [
  { id: "LOG-1001", user: "superadmin", action: "UPDATE_SYSTEM_CONFIG", details: "Updated OAuth2 security parameters", ip: "192.168.1.10", timestamp: "2026-07-31 21:10:00" },
  { id: "LOG-1002", user: "admin", action: "CREATE_PATIENT", details: "Registered patient UHID-20260731-1042", ip: "192.168.1.25", timestamp: "2026-07-31 20:45:12" },
  { id: "LOG-1003", user: "superadmin", action: "ASSIGN_ROLE", details: "Granted ROLE_DOCTOR to user ID: doc-440", ip: "192.168.1.10", timestamp: "2026-07-31 19:30:00" },
  { id: "LOG-1004", user: "admin", action: "GENERATE_INVOICE", details: "Billed invoice INV-99402 ($150.00)", ip: "192.168.1.25", timestamp: "2026-07-31 18:15:22" },
];

export default function AuditLogsPage() {
  return (
    <RoleGuard allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">System Audit Logs</h1>
            <p className="text-xs text-muted-foreground mt-1">Super Admin security audit trail</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-300 dark:border-purple-700 rounded-xl text-purple-700 dark:text-purple-300 text-xs font-semibold">
            <Shield className="w-4 h-4" />
            <span>SUPER ADMIN ONLY</span>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Activity Trail</span>
            </div>
            <span className="text-xs text-muted-foreground">{mockAuditLogs.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted text-muted-foreground font-semibold border-b border-border uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Log ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-card-foreground">
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-primary">{log.id}</td>
                    <td className="py-3 px-4 font-semibold">{log.user}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-muted border border-border font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{log.details}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{log.ip}</td>
                    <td className="py-3 px-4 text-muted-foreground">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
