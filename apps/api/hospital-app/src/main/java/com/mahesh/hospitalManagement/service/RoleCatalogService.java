package com.mahesh.hospitalManagement.service;

import com.mahesh.hospitalManagement.dto.RoleCatalogItemDto;
import com.mahesh.hospitalManagement.entity.type.RoleType;
import com.mahesh.hospitalManagement.repository.UserRepository;
import com.mahesh.hospitalManagement.security.RolePermissionMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleCatalogService {

    private final UserRepository userRepository;

    private static final Map<RoleType, String[]> META = new EnumMap<>(RoleType.class);

    static {
        // role -> displayName, category, stationPath, description, demoUsername
        put(RoleType.SUPER_ADMIN, "Super Admin", "Platform", "/dashboard", "SaaS platform operator", "superadmin@email.com");
        put(RoleType.ADMIN, "Hospital Admin", "Admin", "/dashboard", "Hospital administrator", "admin");
        put(RoleType.DOCTOR, "Doctor", "Clinical", "/opd", "Physician / consultant (specialty via department)", "doctor");
        put(RoleType.NURSE, "Nurse", "Nursing", "/nurse", "Ward nursing & ADT-lite", "nurse");
        put(RoleType.PATIENT, "Patient", "Portal", "/dashboard", "Patient portal user", null);
        put(RoleType.RECEPTIONIST, "Receptionist", "Front Office", "/reception", "Registration, queue, front desk", "receptionist");
        put(RoleType.CASHIER, "Cashier", "Finance", "/billing", "Payment collection desk", "cashier");
        put(RoleType.ACCOUNTANT, "Accountant", "Finance", "/stations/accountant", "Accounts & financial reporting", "accountant");
        put(RoleType.TPA_INSURANCE, "TPA / Insurance", "Finance", "/stations/tpa-insurance", "Insurance eligibility & claims desk", "tpainsurance");
        put(RoleType.MRD, "MRD / HIM", "Records", "/stations/mrd", "Medical records & HIM", "mrd");
        put(RoleType.PHARMACIST, "Pharmacist", "Pharmacy", "/pharmacy", "Dispense & pharmacy inventory", "pharmacist");
        put(RoleType.LAB_TECH, "Lab Technician", "Diagnostics", "/laboratory", "Specimen & lab results", "labtech");
        put(RoleType.LAB_MANAGER, "Lab Manager", "Diagnostics", "/stations/lab-manager", "Pathology lab supervisor", "labmanager");
        put(RoleType.RADIOLOGIST, "Radiologist", "Diagnostics", "/stations/radiologist", "Imaging report sign-off", "radiologist");
        put(RoleType.RADIOLOGY_TECH, "Radiology Tech", "Diagnostics", "/stations/radiology-tech", "X-ray / CT / MRI / USG tech", "radiologytech");
        put(RoleType.BLOOD_BANK, "Blood Bank", "Diagnostics", "/stations/blood-bank", "Blood bank officer / tech", "bloodbank");
        put(RoleType.OT_COORDINATOR, "OT Coordinator", "Clinical Support", "/stations/ot-coordinator", "Operation theatre scheduling", "otcoordinator");
        put(RoleType.ANESTHETIST, "Anesthetist", "Clinical", "/stations/anesthetist", "Anesthesia clinical station", "anesthetist");
        put(RoleType.PHYSIOTHERAPIST, "Physiotherapist", "Allied Health", "/stations/physiotherapist", "Rehab / physiotherapy", "physiotherapist");
        put(RoleType.HR_ADMIN, "HR Admin", "Admin", "/stations/hr-admin", "Staff HR & rostering support", "hradmin");
        put(RoleType.QUALITY_OFFICER, "Quality Officer", "Governance", "/stations/quality", "NABH / quality & compliance", "qualityofficer");
    }

    private static void put(RoleType role, String display, String category, String path, String desc, String user) {
        META.put(role, new String[]{display, category, path, desc, user == null ? "" : user});
    }

    public List<RoleCatalogItemDto> getCatalog() {
        return Arrays.stream(RoleType.values())
                .map(this::toItem)
                .collect(Collectors.toList());
    }

    public RoleCatalogItemDto getRole(RoleType role) {
        return toItem(role);
    }

    private RoleCatalogItemDto toItem(RoleType role) {
        String[] m = META.getOrDefault(role, new String[]{role.name(), "Other", "/dashboard", role.name(), ""});
        String demoUser = m[4];
        boolean seeded = !demoUser.isBlank() && userRepository.findByUsername(demoUser).isPresent();
        if (!seeded && "superadmin@email.com".equals(demoUser)) {
            seeded = userRepository.findByUsername("superadmin@email.com").isPresent()
                    || userRepository.findByUsername("superadmin").isPresent();
        }
        return RoleCatalogItemDto.builder()
                .role(role.name())
                .displayName(m[0])
                .category(m[1])
                .stationPath(m[2])
                .description(m[3])
                .permissions(RolePermissionMapping.getPermissionsForRole(role).stream()
                        .map(Enum::name)
                        .sorted()
                        .collect(Collectors.toList()))
                .seeded(seeded)
                .demoUsername(demoUser.isBlank() ? null : demoUser)
                .build();
    }
}
