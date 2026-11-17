package com.mahesh.hospitalManagement.entity.type;

/**
 * MediCore HIS system roles (~21).
 * Clinical specialty (Cardiology, Ortho, etc.) stays on Doctor/Department — not separate login roles.
 */
public enum RoleType {
    // Platform / hospital admin
    SUPER_ADMIN,
    ADMIN,

    // Clinical core
    DOCTOR,
    NURSE,
    PATIENT,

    // Front office / revenue
    RECEPTIONIST,
    CASHIER,
    ACCOUNTANT,
    TPA_INSURANCE,
    MRD,

    // Pharmacy
    PHARMACIST,

    // Diagnostics
    LAB_TECH,
    LAB_MANAGER,
    RADIOLOGIST,
    RADIOLOGY_TECH,
    BLOOD_BANK,

    // Specialty clinical stations
    OT_COORDINATOR,
    ANESTHETIST,
    PHYSIOTHERAPIST,

    // Support / governance
    HR_ADMIN,
    QUALITY_OFFICER
}
