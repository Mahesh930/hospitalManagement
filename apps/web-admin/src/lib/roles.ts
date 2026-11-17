export const EXTENDED_STATION_ROLES = [
  "ACCOUNTANT",
  "TPA_INSURANCE",
  "MRD",
  "LAB_MANAGER",
  "RADIOLOGIST",
  "RADIOLOGY_TECH",
  "BLOOD_BANK",
  "OT_COORDINATOR",
  "ANESTHETIST",
  "PHYSIOTHERAPIST",
  "HR_ADMIN",
  "QUALITY_OFFICER",
] as const;

export const ROLE_STATION_META: Record<
  string,
  { title: string; subtitle: string; href: string; modules: string[] }
> = {
  ACCOUNTANT: {
    title: "Accounts Station",
    subtitle: "Financial reporting, invoice oversight, and settlement tracking",
    href: "/stations/accountant",
    modules: ["Invoice register", "Revenue stats", "Discount / refund review"],
  },
  TPA_INSURANCE: {
    title: "TPA / Insurance Desk",
    subtitle: "Eligibility, pre-auth tracking, and claims coordination",
    href: "/stations/tpa-insurance",
    modules: ["Patient insurance lookup", "Invoice review", "Claims queue"],
  },
  MRD: {
    title: "Medical Records (MRD)",
    subtitle: "HIM / chart completeness and patient record access",
    href: "/stations/mrd",
    modules: ["Patient search", "Record completeness", "Release of information"],
  },
  LAB_MANAGER: {
    title: "Lab Manager Station",
    subtitle: "Pathology lab supervision, TAT, and quality oversight",
    href: "/stations/lab-manager",
    modules: ["Lab worklist", "Lab stats", "Result sign-off oversight"],
  },
  RADIOLOGIST: {
    title: "Radiologist Station",
    subtitle: "Imaging report review and clinical sign-off",
    href: "/stations/radiologist",
    modules: ["Imaging worklist", "Result reporting", "Abnormal flags"],
  },
  RADIOLOGY_TECH: {
    title: "Radiology Tech Station",
    subtitle: "Modality worklist and study acquisition",
    href: "/stations/radiology-tech",
    modules: ["Modality queue", "Study capture", "Sample / study status"],
  },
  BLOOD_BANK: {
    title: "Blood Bank Station",
    subtitle: "Blood unit requests, cross-match, and issue tracking",
    href: "/stations/blood-bank",
    modules: ["Request queue", "Inventory units", "Issue / return"],
  },
  OT_COORDINATOR: {
    title: "OT Coordinator Station",
    subtitle: "Operation theatre scheduling and board management",
    href: "/stations/ot-coordinator",
    modules: ["OT board", "Surgery slots", "Pre-op checklist"],
  },
  ANESTHETIST: {
    title: "Anesthetist Station",
    subtitle: "Pre-anesthesia assessment and OT clinical support",
    href: "/stations/anesthetist",
    modules: ["Pre-op assessments", "OT list", "Patient clinical summary"],
  },
  PHYSIOTHERAPIST: {
    title: "Physiotherapy Station",
    subtitle: "Rehab sessions and therapy scheduling",
    href: "/stations/physiotherapist",
    modules: ["Therapy queue", "Session notes", "Appointments"],
  },
  HR_ADMIN: {
    title: "HR Admin Station",
    subtitle: "Staff provisioning and workforce support",
    href: "/stations/hr-admin",
    modules: ["Staff directory", "Role assignment", "Onboarding"],
  },
  QUALITY_OFFICER: {
    title: "Quality / NABH Station",
    subtitle: "Compliance monitoring and clinical quality indicators",
    href: "/stations/quality",
    modules: ["Quality indicators", "Incident review", "Audit readiness"],
  },
};
