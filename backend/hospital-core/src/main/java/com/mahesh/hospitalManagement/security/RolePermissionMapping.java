package com.mahesh.hospitalManagement.security;

import com.mahesh.hospitalManagement.entity.type.PermissionType;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static com.mahesh.hospitalManagement.entity.type.PermissionType.*;
import static com.mahesh.hospitalManagement.entity.type.RoleType.*;

public class RolePermissionMapping {
    private static final Map<RoleType, Set<PermissionType>> map = Map.of(
            SUPER_ADMIN, Set.of(PATIENT_READ, PATIENT_WRITE, APPOINTMENT_READ, APPOINTMENT_WRITE, APPOINTMENT_DELETE,
                    OPD_READ, OPD_WRITE, BILLING_READ, BILLING_WRITE, MASTER_DATA_MANAGE, USER_MANAGE, REPORT_VIEW),
            ADMIN, Set.of(PATIENT_READ, PATIENT_WRITE, APPOINTMENT_READ, APPOINTMENT_WRITE, APPOINTMENT_DELETE,
                    OPD_READ, OPD_WRITE, BILLING_READ, BILLING_WRITE, MASTER_DATA_MANAGE, USER_MANAGE, REPORT_VIEW),
            PATIENT, Set.of(PATIENT_READ, APPOINTMENT_READ, APPOINTMENT_WRITE, BILLING_READ),
            DOCTOR, Set.of(APPOINTMENT_DELETE, APPOINTMENT_WRITE, APPOINTMENT_READ, PATIENT_READ, OPD_READ, OPD_WRITE),
            RECEPTIONIST, Set.of(PATIENT_READ, PATIENT_WRITE, APPOINTMENT_READ, APPOINTMENT_WRITE, OPD_READ, OPD_WRITE, BILLING_READ, REPORT_VIEW),
            CASHIER, Set.of(PATIENT_READ, BILLING_READ, BILLING_WRITE),
            NURSE, Set.of(PATIENT_READ, OPD_READ, OPD_WRITE, APPOINTMENT_READ),
            PHARMACIST, Set.of(PATIENT_READ, OPD_READ, MASTER_DATA_MANAGE),
            LAB_TECH, Set.of(PATIENT_READ, OPD_READ, REPORT_VIEW)
    );

    public static Set<SimpleGrantedAuthority> getAuthoritiesForRole(RoleType role) {
        return map.getOrDefault(role, Set.of()).stream()
                .map(permission -> new SimpleGrantedAuthority(permission.getPermission()))
                .collect(Collectors.toSet());
    }
}
