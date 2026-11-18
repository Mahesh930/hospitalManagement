import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</h1>
        {subtitle ? (
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>{subtitle}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
