import type { CSSProperties, ReactNode } from "react";

const tones: Record<string, CSSProperties> = {
  success: { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0" },
  warning: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" },
  danger: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" },
  info: { background: "#f0fdfa", color: "#0f766e", border: "1px solid #99f6e4" },
  neutral: { background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" },
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      style={{
        ...tones[tone],
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
