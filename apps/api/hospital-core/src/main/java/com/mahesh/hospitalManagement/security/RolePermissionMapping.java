package com.mahesh.hospitalManagement.security;

import com.mahesh.hospitalManagement.entity.type.PermissionType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.mahesh.hospitalManagement.entity.type.PermissionType.*;
import static com.mahesh.hospitalManagement.entity.type.RoleType.*;

public final class RolePermissionMapping {

    private static final Map<RoleType, Set<PermissionType>> MAP = new EnumMap<>(RoleType.class);

    static {
        MAP.put(SUPER_ADMIN, Set.of(PermissionType.values()));
        MAP.put(ADMIN, Set.of(
                PATIENT_READ, PATIENT_WRITE, APPOINTMENT_READ, APPOINTMENT_WRITE, APPOINTMENT_DELETE,
                OPD_READ, OPD_WRITE, BILLING_READ, BILLING_WRITE, MASTER_DATA_MANAGE, USER_MANAGE,
                REPORT_VIEW, NURSE_READ, NURSE_WRITE, BED_MANAGE, LAB_READ, LAB_WRITE, RADIOLOGY_READ,
                RADIOLOGY_WRITE, PHARMACY_READ, PHARMACY_WRITE, INSURANCE_READ, INSURANCE_WRITE,
                HR_MANAGE, QUALITY_READ, QUALITY_WRITE, BLOOD_BANK_READ, BLOOD_BANK_WRITE, OT_MANAGE,
                RECORDS_MANAGE
        ));
        MAP.put(PATIENT, Set.of(PATIENT_READ, APPOINTMENT_READ, APPOINTMENT_WRITE, BILLING_READ, LAB_READ));
        MAP.put(DOCTOR, Set.of(
                PATIENT_READ, APPOINTMENT_READ, APPOINTMENT_WRITE, APPOINTMENT_DELETE,
                OPD_READ, OPD_WRITE, NURSE_READ, LAB_READ, LAB_WRITE, RADIOLOGY_READ, REPORT_VIEW
        ));
        MAP.put(RECEPTIONIST, Set.of(
                PATIENT_READ, PATIENT_WRITE, APPOINTMENT_READ, APPOINTMENT_WRITE,
                OPD_READ, BILLING_READ, REPORT_VIEW, INSURANCE_READ
        ));
        MAP.put(CASHIER, Set.of(PATIENT_READ, BILLING_READ, BILLING_WRITE, REPORT_VIEW));
        MAP.put(ACCOUNTANT, Set.of(PATIENT_READ, BILLING_READ, BILLING_WRITE, REPORT_VIEW, INSURANCE_READ));
        MAP.put(TPA_INSURANCE, Set.of(PATIENT_READ, BILLING_READ, INSURANCE_READ, INSURANCE_WRITE, REPORT_VIEW));
        MAP.put(MRD, Set.of(PATIENT_READ, PATIENT_WRITE, RECORDS_MANAGE, REPORT_VIEW, APPOINTMENT_READ));
        MAP.put(NURSE, Set.of(
                PATIENT_READ, OPD_READ, OPD_WRITE, APPOINTMENT_READ, NURSE_READ, NURSE_WRITE,
                BED_MANAGE, LAB_READ
        ));
        MAP.put(PHARMACIST, Set.of(PATIENT_READ, OPD_READ, PHARMACY_READ, PHARMACY_WRITE, MASTER_DATA_MANAGE, BILLING_READ, REPORT_VIEW));
        MAP.put(LAB_TECH, Set.of(PATIENT_READ, OPD_READ, LAB_READ, LAB_WRITE, REPORT_VIEW));
        MAP.put(LAB_MANAGER, Set.of(PATIENT_READ, OPD_READ, LAB_READ, LAB_WRITE, MASTER_DATA_MANAGE, REPORT_VIEW, USER_MANAGE));
        MAP.put(RADIOLOGIST, Set.of(PATIENT_READ, OPD_READ, OPD_WRITE, RADIOLOGY_READ, RADIOLOGY_WRITE, LAB_READ, REPORT_VIEW, APPOINTMENT_READ));
        MAP.put(RADIOLOGY_TECH, Set.of(PATIENT_READ, RADIOLOGY_READ, RADIOLOGY_WRITE, APPOINTMENT_READ, REPORT_VIEW));
        MAP.put(BLOOD_BANK, Set.of(PATIENT_READ, BLOOD_BANK_READ, BLOOD_BANK_WRITE, LAB_READ, OPD_READ, REPORT_VIEW));
        MAP.put(OT_COORDINATOR, Set.of(PATIENT_READ, APPOINTMENT_READ, APPOINTMENT_WRITE, BED_MANAGE, NURSE_READ, OT_MANAGE, REPORT_VIEW));
        MAP.put(ANESTHETIST, Set.of(PATIENT_READ, OPD_READ, OPD_WRITE, OT_MANAGE, NURSE_READ, APPOINTMENT_READ, REPORT_VIEW));
        MAP.put(PHYSIOTHERAPIST, Set.of(PATIENT_READ, OPD_READ, APPOINTMENT_READ, APPOINTMENT_WRITE, REPORT_VIEW));
        MAP.put(HR_ADMIN, Set.of(USER_MANAGE, HR_MANAGE, REPORT_VIEW));
        MAP.put(QUALITY_OFFICER, Set.of(QUALITY_READ, QUALITY_WRITE, REPORT_VIEW, PATIENT_READ, OPD_READ, NURSE_READ));
    }

    private RolePermissionMapping() {}

    public static Set<SimpleGrantedAuthority> getAuthoritiesForRole(RoleType role) {
        return MAP.getOrDefault(role, Set.of()).stream()
                .map(permission -> new SimpleGrantedAuthority(permission.getPermission()))
                .collect(Collectors.toSet());
    }

    public static Set<PermissionType> getPermissionsForRole(RoleType role) {
        return MAP.getOrDefault(role, Set.of());
    }
}
