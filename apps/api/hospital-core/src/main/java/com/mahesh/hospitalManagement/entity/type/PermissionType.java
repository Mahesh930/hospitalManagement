package com.mahesh.hospitalManagement.entity.type;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PermissionType {

    PATIENT_READ("patient:read"),
    PATIENT_WRITE("patient:write"),
    APPOINTMENT_READ("appointment:read"),
    APPOINTMENT_WRITE("appointment:write"),
    APPOINTMENT_DELETE("appointment:delete"),
    OPD_READ("opd:read"),
    OPD_WRITE("opd:write"),
    BILLING_READ("billing:read"),
    BILLING_WRITE("billing:write"),
    MASTER_DATA_MANAGE("master_data:manage"),
    USER_MANAGE("user:manage"),
    REPORT_VIEW("report:view"),
    NURSE_READ("nurse:read"),
    NURSE_WRITE("nurse:write"),
    BED_MANAGE("bed:manage"),
    LAB_READ("lab:read"),
    LAB_WRITE("lab:write"),
    RADIOLOGY_READ("radiology:read"),
    RADIOLOGY_WRITE("radiology:write"),
    PHARMACY_READ("pharmacy:read"),
    PHARMACY_WRITE("pharmacy:write"),
    INSURANCE_READ("insurance:read"),
    INSURANCE_WRITE("insurance:write"),
    HR_MANAGE("hr:manage"),
    QUALITY_READ("quality:read"),
    QUALITY_WRITE("quality:write"),
    BLOOD_BANK_READ("blood_bank:read"),
    BLOOD_BANK_WRITE("blood_bank:write"),
    OT_MANAGE("ot:manage"),
    RECORDS_MANAGE("records:manage");

    private final String permission;
}
