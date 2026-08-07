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
    REPORT_VIEW("report:view");

    private final String permission;
}
